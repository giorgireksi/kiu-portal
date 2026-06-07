(function initLibraryPageController() {
    'use strict';

    const FILTER_FIELDS = ['topic', 'language', 'status'];
    const LIBRARY_PAGE_SHELL_MARKUP = `
        <div class="page-hero library-page-hero lux-summary-surface lux-summary-surface--hero" data-library-shell="1">
            <div class="lux-hero-stage">
                <div class="lux-hero-main">
                    <div class="page-hero-title">Research and Reference Library</div>
                    <div class="page-hero-copy">Browse official books, topical references, and PDF resources in the same luxury shell used across the portal.</div>
                    <div class="page-hero-meta">
                        <span class="page-hero-badge wave2-chip wave2-chip--hero"><i class="fas fa-book-open"></i> Shared catalog</span>
                        <span class="page-hero-badge wave2-chip wave2-chip--hero"><i class="fas fa-filter"></i> Topic and language filters</span>
                        <span class="page-hero-badge wave2-chip wave2-chip--hero"><i class="fas fa-file-pdf"></i> PDF access</span>
                    </div>
                </div>
                <aside class="lux-hero-side library-hero-side library-hero-summary">
                    <div class="lux-hero-side-head library-hero-summary-card">
                        <strong id="library-hero-total" class="library-hero-summary-value">0 books</strong>
                        <span class="library-hero-summary-copy">Index-style summary signals for the catalog and the current filtered shelf.</span>
                    </div>
                    <div class="lux-hero-signal-list library-hero-signal-grid">
                        <div class="lux-hero-signal library-hero-signal-card library-hero-signal-card--visible">
                            <span class="library-hero-signal-label">Visible now</span>
                            <strong id="library-hero-visible" class="library-hero-signal-value">0</strong>
                            <em class="library-hero-signal-copy">Books matching the active filters.</em>
                        </div>
                        <div class="lux-hero-signal library-hero-signal-card library-hero-signal-card--pdf">
                            <span class="library-hero-signal-label">PDF ready</span>
                            <strong id="library-hero-pdf" class="library-hero-signal-value">0</strong>
                            <em class="library-hero-signal-copy">Filtered entries with downloadable PDFs.</em>
                        </div>
                        <div class="lux-hero-signal library-hero-signal-card library-hero-signal-card--active">
                            <span class="library-hero-signal-label">Active shelf</span>
                            <strong id="library-hero-active" class="library-hero-signal-value">0</strong>
                            <em class="library-hero-signal-copy">Filtered entries currently marked active.</em>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
        <section class="lux-strip-grid lux-strip-grid--adaptive library-widget-strip">
            <article class="lux-strip-card surface-card library-overview-card library-hero-metric wave2-summary-card library-hero-metric--visible">
                <div class="lux-card-body lux-mini-panel">
                    <div class="lux-card-title wave2-summary-label">Visible shelf</div>
                    <h3 id="library-widget-visible" class="wave2-summary-value">0</h3>
                    <p class="wave2-summary-copy">Books matching the current search and picker state.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card library-overview-card library-hero-metric wave2-summary-card library-hero-metric--topics">
                <div class="lux-card-body lux-mini-panel">
                    <div class="lux-card-title wave2-summary-label">Topic lanes</div>
                    <h3 id="library-widget-topics" class="wave2-summary-value">0</h3>
                    <p class="wave2-summary-copy">Distinct catalog topics available in the current shelf.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card library-overview-card library-hero-metric wave2-summary-card library-hero-metric--languages">
                <div class="lux-card-body lux-mini-panel">
                    <div class="lux-card-title wave2-summary-label">Language lanes</div>
                    <h3 id="library-widget-languages" class="wave2-summary-value">0</h3>
                    <p class="wave2-summary-copy">Languages still represented after filtering the shelf.</p>
                </div>
            </article>
        </section>
        <div class="filter-shell library-filter-shell library-filter-panel surface-card lux-summary-surface lux-summary-surface--panel">
            <div class="filter-shell-title">Browse Catalog</div>
            <div class="library-filter-bar library-search-grid library-filter-grid lux-data-card">
                <label class="lux-picker-field library-picker-field library-filter-field library-filter-field--search">
                    <span class="lux-picker-label library-picker-label">Search</span>
                    <input id="library-filter-search" type="text" class="library-field-input lux-control library-filter-input" placeholder="Search by title, subtitle, author, year..." data-library-search-field="query">
                </label>
                <div class="lux-picker-field library-picker-field library-filter-field library-filter-field--picker">
                    <span class="lux-picker-label library-picker-label">Topic</span>
                    <button type="button" class="lux-picker-btn library-picker-btn library-filter-picker-btn" id="library-filter-topic-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="topic">
                        <span class="library-picker-btn-copy library-filter-picker-copy lux-picker-copy">
                            <strong id="library-filter-topic-value">All Topics</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel lux-picker-panel-scroll library-picker-panel library-filter-picker-panel" id="library-filter-topic-panel"></div>
                    <select id="library-filter-topic" class="library-hidden-select library-filter-hidden-select lux-filter-hidden-select" data-library-select-field="topic"></select>
                </div>
                <div class="lux-picker-field library-picker-field library-filter-field library-filter-field--picker">
                    <span class="lux-picker-label library-picker-label">Language</span>
                    <button type="button" class="lux-picker-btn library-picker-btn library-filter-picker-btn" id="library-filter-language-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="language">
                        <span class="library-picker-btn-copy library-filter-picker-copy lux-picker-copy">
                            <strong id="library-filter-language-value">All Languages</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel lux-picker-panel-scroll library-picker-panel library-filter-picker-panel" id="library-filter-language-panel"></div>
                    <select id="library-filter-language" class="library-hidden-select library-filter-hidden-select lux-filter-hidden-select" data-library-select-field="language"></select>
                </div>
                <div class="lux-picker-field library-picker-field library-filter-field library-filter-field--picker">
                    <span class="lux-picker-label library-picker-label">Status</span>
                    <button type="button" class="lux-picker-btn library-picker-btn library-filter-picker-btn" id="library-filter-status-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="status">
                        <span class="library-picker-btn-copy library-filter-picker-copy lux-picker-copy">
                            <strong id="library-filter-status-value">All Statuses</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel lux-picker-panel-scroll library-picker-panel library-filter-picker-panel" id="library-filter-status-panel"></div>
                    <select id="library-filter-status" class="library-hidden-select library-filter-hidden-select lux-filter-hidden-select" data-library-select-field="status"></select>
                </div>
            </div>
        </div>
        <div class="content-box surface-card library-catalog-card lux-summary-surface lux-summary-surface--panel">
            <div class="tabs-container library-tabs lux-tab-strip">
                <button type="button" class="tab active library-tab-fill lux-tab-fill lux-select-card lux-tab-btn" aria-pressed="true">Books</button>
                <button type="button" class="tab library-tab-fill lux-tab-fill lux-select-card lux-tab-btn" aria-pressed="false">Read-only for students, professors, and TAs</button>
            </div>
            <div class="library-scroll-wrap">
                <table class="kiu-table library-catalog-table library-table-min-800">
                    <thead><tr><th>Code</th><th>Title</th><th>Sub Title</th><th>Author</th><th>Year</th><th>Subject (Topic)</th><th>Language</th><th>Status</th><th>PDF</th></tr></thead>
                    <tbody id="shared-library-body"></tbody>
                </table>
            </div>
            <div class="library-catalog-foot library-catalog-footer">
                <span id="shared-library-count" class="library-catalog-count">0 books</span>
            </div>
        </div>
    `;

    const runtime = {
        bound: false
    };

    function escapeLibraryHtml(value) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(value);
        }
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function ensureSharedLibraryState() {
        if (!KIU_STATE.adminLibrary) KIU_STATE.adminLibrary = {};
        if (!Array.isArray(KIU_STATE.adminLibrary.books)) KIU_STATE.adminLibrary.books = [];
        if (!KIU_STATE.adminLibrary.params) KIU_STATE.adminLibrary.params = {};
        if (!Array.isArray(KIU_STATE.adminLibrary.params.thematic)) KIU_STATE.adminLibrary.params.thematic = ['General'];
        if (!Array.isArray(KIU_STATE.adminLibrary.params.language)) KIU_STATE.adminLibrary.params.language = ['English'];
        if (!Array.isArray(KIU_STATE.adminLibrary.params.status)) KIU_STATE.adminLibrary.params.status = ['Active'];
    }

    function hasAdminLibraryWorkspace(root) {
        return Boolean(root?.querySelector?.('.alib-workspace'));
    }

    function ensureLibraryPageShell() {
        const root = document.getElementById('page-library');
        if (!root) return null;
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            return root;
        }
        if (root.querySelector('[data-library-shell="1"]')) return root;
        root.innerHTML = LIBRARY_PAGE_SHELL_MARKUP;
        return root;
    }

    function getLibraryPickerMeta(field) {
        return {
            topic: { label: 'Topic', subtitle: 'Pick a subject area for the catalog' },
            language: { label: 'Language', subtitle: 'Choose a catalog language' },
            status: { label: 'Status', subtitle: 'Filter active or archived books' }
        }[field] || { label: field, subtitle: 'Filter the library catalog' };
    }

    function syncLibraryPickerValue(field) {
        const select = document.getElementById(`library-filter-${field}`);
        const value = document.getElementById(`library-filter-${field}-value`);
        const button = document.getElementById(`library-filter-${field}-btn`);
        if (!select || !value || !button) return;
        const selected = select.selectedOptions?.[0];
        value.textContent = selected ? selected.textContent : `All ${field.charAt(0).toUpperCase() + field.slice(1)}s`;
        button.setAttribute('aria-expanded', 'false');
    }

    function createLibraryCell(text) {
        const cell = document.createElement('td');
        cell.className = 'library-catalog-cell';
        cell.textContent = text;
        return cell;
    }

    function createLibraryPdfCell(pdfLink) {
        const cell = document.createElement('td');
        cell.className = 'library-catalog-cell library-catalog-pdf-cell';
        if (!pdfLink) {
            cell.textContent = '-';
            return cell;
        }
        const link = document.createElement('a');
        link.href = pdfLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'library-pdf-link library-catalog-pdf-link';
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-pdf';
        link.appendChild(icon);
        cell.appendChild(link);
        return cell;
    }

    function createLibraryRow(book, index) {
        const row = document.createElement('tr');
        row.className = 'library-catalog-row';
        [
            book.id ? String(book.id) : `BK-${index + 1}`,
            book.title || '-',
            book.subtitle || '-',
            book.author || '-',
            book.year || '-',
            book.thematic || '-',
            book.language || '-',
            book.status || '-'
        ].forEach((value) => {
            row.appendChild(createLibraryCell(value));
        });
        row.appendChild(createLibraryPdfCell(book.pdfLink || ''));
        return row;
    }

    function createLibraryPickerOption(field, option, currentValue) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-picker-option';
        button.dataset.libraryFilter = field;
        button.dataset.libraryValue = option.value;

        if (String(option.value) === String(currentValue)) {
            button.classList.add('is-active');
        }

        const title = document.createElement('strong');
        title.textContent = option.label;
        button.appendChild(title);

        const subtitle = document.createElement('span');
        subtitle.textContent = String(option.value) === String(currentValue)
            ? 'Current filter'
            : getLibraryPickerMeta(field).subtitle;
        button.appendChild(subtitle);

        return button;
    }

    function createLibrarySelectOption(value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    function renderLibraryEmptyState(tbody) {
        const row = document.createElement('tr');
        row.className = 'library-empty-row library-catalog-empty-row';
        const cell = document.createElement('td');
        cell.className = 'library-empty-cell library-catalog-cell library-catalog-empty-cell';
        cell.colSpan = 9;
        cell.textContent = 'No books found.';
        row.appendChild(cell);
        tbody.replaceChildren(row);
    }

    function renderSharedLibraryCatalog() {
        ensureSharedLibraryState();
        const tbody = document.getElementById('shared-library-body');
        if (!tbody) return;

        const search = (document.getElementById('library-filter-search')?.value || '').trim().toLowerCase();
        const topic = document.getElementById('library-filter-topic')?.value || 'all';
        const language = document.getElementById('library-filter-language')?.value || 'all';
        const status = document.getElementById('library-filter-status')?.value || 'all';

        const books = (KIU_STATE.adminLibrary.books || []).filter((book) => {
            const qMatch = !search
                || String(book.title || '').toLowerCase().includes(search)
                || String(book.subtitle || '').toLowerCase().includes(search)
                || String(book.author || '').toLowerCase().includes(search)
                || String(book.year || '').toLowerCase().includes(search)
                || String(book.thematic || '').toLowerCase().includes(search);
            const topicMatch = topic === 'all' || String(book.thematic || '') === topic;
            const langMatch = language === 'all' || String(book.language || '') === language;
            const statusMatch = status === 'all' || String(book.status || '') === status;
            return qMatch && topicMatch && langMatch && statusMatch;
        });

        if (!books.length) {
            renderLibraryEmptyState(tbody);
        } else {
            const fragment = document.createDocumentFragment();
            books.forEach((book, index) => {
                fragment.appendChild(createLibraryRow(book, index));
            });
            tbody.replaceChildren(fragment);
        }

        const count = document.getElementById('shared-library-count');
        if (count) count.textContent = `${books.length} book${books.length === 1 ? '' : 's'}`;

        const totalCount = (KIU_STATE.adminLibrary.books || []).length;
        const pdfCount = books.filter((book) => Boolean(book.pdfLink)).length;
        const activeCount = books.filter((book) => String(book.status || '').toLowerCase() === 'active').length;
        const topicCount = new Set(books.map((book) => String(book.thematic || '').trim()).filter(Boolean)).size;
        const languageCount = new Set(books.map((book) => String(book.language || '').trim()).filter(Boolean)).size;

        const metrics = {
            'library-hero-total': `${totalCount} books`,
            'library-hero-visible': String(books.length),
            'library-hero-pdf': String(pdfCount),
            'library-hero-active': String(activeCount),
            'library-widget-visible': String(books.length),
            'library-widget-topics': String(topicCount),
            'library-widget-languages': String(languageCount)
        };
        Object.entries(metrics).forEach(([id, value]) => {
            const node = document.getElementById(id);
            if (node) node.textContent = value;
        });
    }

    function renderLibraryPickerPanel(field, options, currentValue) {
        const panel = document.getElementById(`library-filter-${field}-panel`);
        if (!panel) return;
        const fragment = document.createDocumentFragment();
        options.forEach((option) => {
            fragment.appendChild(createLibraryPickerOption(field, option, currentValue));
        });
        panel.replaceChildren(fragment);
        panel.querySelectorAll('[data-library-filter]').forEach((optionButton) => {
            optionButton.addEventListener('click', () => {
                const select = document.getElementById(`library-filter-${field}`);
                if (!select) return;
                select.value = optionButton.dataset.libraryValue || 'all';
                syncLibraryPickerValue(field);
                if (typeof window.closePickerPanels === 'function') {
                    window.closePickerPanels();
                }
                renderSharedLibraryCatalog();
            });
        });
    }

    function renderLibraryPicker(field, items, defaultLabel) {
        const select = document.getElementById(`library-filter-${field}`);
        if (!select) return;
        const options = [
            { value: 'all', label: defaultLabel },
            ...(Array.isArray(items) ? items : []).map((item) => ({ value: item, label: item }))
        ];
        renderLibraryPickerPanel(field, options, select.value || 'all');
        syncLibraryPickerValue(field);
    }

    function renderSharedLibraryFilters() {
        ensureSharedLibraryState();
        const params = KIU_STATE.adminLibrary.params || {};
        const applyOptions = (id, label, items) => {
            const el = document.getElementById(id);
            if (!el) return;
            const fragment = document.createDocumentFragment();
            fragment.appendChild(createLibrarySelectOption('all', label));
            (Array.isArray(items) ? items : []).forEach((item) => {
                fragment.appendChild(createLibrarySelectOption(String(item), String(item)));
            });
            el.replaceChildren(fragment);
        };

        applyOptions('library-filter-topic', 'All Topics', params.thematic);
        applyOptions('library-filter-language', 'All Languages', params.language);
        applyOptions('library-filter-status', 'All Statuses', params.status);

        FILTER_FIELDS.forEach((field) => syncLibraryPickerValue(field));
    }

    function bindLibraryInteractions() {
        if (runtime.bound) return;
        runtime.bound = true;
        const search = document.getElementById('library-filter-search');
        if (search) {
            search.addEventListener('input', renderSharedLibraryCatalog);
        }

        FILTER_FIELDS.forEach((field) => {
            const button = document.getElementById(`library-filter-${field}-btn`);
            if (button) {
                button.addEventListener('click', () => {
                    const params = KIU_STATE.adminLibrary?.params || {};
                    const options = field === 'topic'
                        ? params.thematic
                        : field === 'language'
                            ? params.language
                            : params.status;
                    const defaultLabel = field === 'topic'
                        ? 'All Topics'
                        : field === 'language'
                            ? 'All Languages'
                            : 'All Statuses';
                    renderLibraryPicker(field, options, defaultLabel);
                    if (typeof window.togglePickerPanel === 'function') {
                        window.togglePickerPanel(`library-filter-${field}-panel`, `library-filter-${field}-btn`);
                    }
                });
            }

            const select = document.getElementById(`library-filter-${field}`);
            if (select) {
                select.addEventListener('change', () => {
                    syncLibraryPickerValue(field);
                    renderSharedLibraryCatalog();
                });
            }
        });

        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target !== overlay) return;
                if (typeof window.closeAllModals === 'function') window.closeAllModals(event);
            });
        }

        document.addEventListener('click', (event) => {
            if (event.target.closest('.library-picker-field')) return;
            if (typeof window.closePickerPanels === 'function') {
                window.closePickerPanels();
            }
        });
    }

    function renderLibraryPageShellContext() {
        const root = document.getElementById('page-library');
        if (!root) return null;
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            return root;
        }
        return ensureLibraryPageShell();
    }

    function renderLibraryPage() {
        const root = document.getElementById('page-library');
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            if (typeof window.renderAdminLibrary === 'function') {
                window.renderAdminLibrary();
            }
            return;
        }
        const shellRoot = renderLibraryPageShellContext();
        if (!shellRoot) return;
        bindLibraryInteractions();
        renderSharedLibraryFilters();
        renderSharedLibraryCatalog();
    }

    window.ensureSharedLibraryState = ensureSharedLibraryState;
    window.renderSharedLibraryFilters = renderSharedLibraryFilters;
    window.renderSharedLibraryCatalog = renderSharedLibraryCatalog;
    window.renderLibraryPageShellContext = renderLibraryPageShellContext;
    window.renderLibraryPage = renderLibraryPage;
    window.initLibraryPage = renderLibraryPage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderLibraryPage, { once: true });
    } else {
        renderLibraryPage();
    }
})();
