(function initLibraryPageController() {
    'use strict';

    const FILTER_FIELDS = ['topic', 'language', 'status'];
    const LIBRARY_PAGE_SHELL_MARKUP = `
        <div class="page-hero library-page-hero lux-summary-surface lux-summary-surface--hero" data-library-shell="1">
            <div class="page-hero-title">Research and Reference Library</div>
            <div class="page-hero-copy">Browse official books, topical references, and PDF resources in the same luxury shell used across the portal.</div>
            <div class="page-hero-meta">
                <span class="page-hero-badge"><i class="fas fa-book-open"></i> Shared catalog</span>
                <span class="page-hero-badge"><i class="fas fa-filter"></i> Topic and language filters</span>
                <span class="page-hero-badge"><i class="fas fa-file-pdf"></i> PDF access</span>
            </div>
        </div>
        <div class="filter-shell library-filter-shell">
            <div class="filter-shell-title">Browse Catalog</div>
            <div class="lib-search-bar library-search-grid">
                <label class="lux-picker-field library-picker-field">
                    <span class="lux-picker-label library-picker-label">Search</span>
                    <input id="library-filter-search" type="text" class="lib-input" placeholder="Search by title, subtitle, author, year..." data-library-search-field="query">
                </label>
                <div class="lux-picker-field library-picker-field">
                    <span class="lux-picker-label library-picker-label">Topic</span>
                    <button type="button" class="lux-picker-btn library-picker-btn" id="library-filter-topic-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="topic">
                        <span class="library-picker-btn-copy">
                            <strong id="library-filter-topic-value">All Topics</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel library-picker-panel" id="library-filter-topic-panel"></div>
                    <select id="library-filter-topic" class="library-hidden-select" data-library-select-field="topic"></select>
                </div>
                <div class="lux-picker-field library-picker-field">
                    <span class="lux-picker-label library-picker-label">Language</span>
                    <button type="button" class="lux-picker-btn library-picker-btn" id="library-filter-language-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="language">
                        <span class="library-picker-btn-copy">
                            <strong id="library-filter-language-value">All Languages</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel library-picker-panel" id="library-filter-language-panel"></div>
                    <select id="library-filter-language" class="library-hidden-select" data-library-select-field="language"></select>
                </div>
                <div class="lux-picker-field library-picker-field">
                    <span class="lux-picker-label library-picker-label">Status</span>
                    <button type="button" class="lux-picker-btn library-picker-btn" id="library-filter-status-btn" aria-haspopup="listbox" aria-expanded="false" data-library-picker-field="status">
                        <span class="library-picker-btn-copy">
                            <strong id="library-filter-status-value">All Statuses</strong>
                        </span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="lux-picker-panel library-picker-panel" id="library-filter-status-panel"></div>
                    <select id="library-filter-status" class="library-hidden-select" data-library-select-field="status"></select>
                </div>
            </div>
        </div>
        <div class="content-box surface-card library-catalog-card lux-summary-surface lux-summary-surface--panel">
            <div class="tabs-container library-tabs">
                <div class="tab active library-tab-fill">Books</div>
                <div class="tab library-tab-fill">Read-only for students, professors, and TAs</div>
            </div>
            <div class="library-scroll-wrap">
                <table class="kiu-table library-catalog-table library-table-min-800">
                    <thead><tr><th>Code</th><th>Title</th><th>Sub Title</th><th>Author</th><th>Year</th><th>Subject (Topic)</th><th>Language</th><th>Status</th><th>PDF</th></tr></thead>
                    <tbody id="shared-library-body"></tbody>
                </table>
            </div>
            <div class="library-catalog-foot">
                <span id="shared-library-count">0 books</span>
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

    function ensureLibraryPageShell() {
        const root = document.getElementById('page-library');
        if (!root) return null;
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
        cell.textContent = text;
        return cell;
    }

    function createLibraryPdfCell(pdfLink) {
        const cell = document.createElement('td');
        if (!pdfLink) {
            cell.textContent = '-';
            return cell;
        }
        const link = document.createElement('a');
        link.href = pdfLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'library-pdf-link';
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-pdf';
        link.appendChild(icon);
        cell.appendChild(link);
        return cell;
    }

    function createLibraryRow(book, index) {
        const row = document.createElement('tr');
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
        row.className = 'library-empty-row';
        const cell = document.createElement('td');
        cell.className = 'library-empty-cell';
        cell.colSpan = 9;
        cell.style.textAlign = 'center';
        cell.style.color = 'var(--kiu-text-muted)';
        cell.style.padding = '24px';
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
        return ensureLibraryPageShell();
    }

    function renderLibraryPage() {
        const root = renderLibraryPageShellContext();
        if (!root) return;
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
