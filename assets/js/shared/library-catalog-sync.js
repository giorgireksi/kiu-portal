(function initLibraryCatalogSync(global) {
    'use strict';

    const DEFAULT_FORM_SCHEMA = [
        { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true, width: 'half', core: true },
        { id: 'subtitle', label: 'Sub Title', type: 'text', placeholder: 'Sub title', required: false, width: 'half', core: false },
        { id: 'year', label: 'Year', type: 'number', placeholder: '2026', required: true, width: 'half', core: false },
        { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true, width: 'half', core: true },
        { id: 'thematic', label: 'Subject (Topic)', type: 'select', placeholder: '', required: true, width: 'half', core: false, paramKey: 'thematic' },
        { id: 'language', label: 'Language', type: 'select', placeholder: '', required: false, width: 'half', core: false, paramKey: 'language' },
        { id: 'status', label: 'Status', type: 'select', placeholder: '', required: false, width: 'half', core: false, paramKey: 'status' },
        { id: 'pdfLink', label: 'PDF Link (Optional)', type: 'url', placeholder: 'https://example.com/book.pdf', required: false, width: 'full', core: false }
    ];

    const DEFAULT_SECTIONS = [{ id: 'books', label: 'Books' }];

    function getLibraryCatalogStateRoot() {
        let state = null;
        try {
            if (typeof KIU_STATE !== 'undefined' && KIU_STATE && typeof KIU_STATE === 'object') {
                state = KIU_STATE;
            }
        } catch (error) {}

        if (!state) {
            if (!global.KIU_STATE || typeof global.KIU_STATE !== 'object') global.KIU_STATE = {};
            state = global.KIU_STATE;
        } else if (global.KIU_STATE !== state) {
            try { global.KIU_STATE = state; } catch (error) {}
        }

        return state;
    }

    function escapeCatalogHtml(value) {
        if (typeof global.escapeHtml === 'function') {
            return global.escapeHtml(value);
        }
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function slugifyLibrarySectionId(label) {
        const base = String(label || '').trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return base || 'section';
    }

    function ensureLibraryCatalogState() {
        const root = getLibraryCatalogStateRoot();
        if (!root.adminLibrary) root.adminLibrary = {};

        const store = root.adminLibrary;
        if (!store.params) store.params = {};
        const paramDefaults = {
            thematic: ['Mathematics', 'Computer Science', 'Economics'],
            language: ['English', 'Georgian'],
            status: ['Active', 'Archived']
        };
        Object.keys(paramDefaults).forEach((key) => {
            if (!Array.isArray(store.params[key]) || !store.params[key].length) {
                store.params[key] = [...paramDefaults[key]];
            }
        });

        if (!Array.isArray(store.books)) store.books = [];
        if (!Array.isArray(store.formSchema)) store.formSchema = [];
        // Seed defaults only when untouched; customized schemas may stay empty intentionally.
        if (!store.formSchema.length && store.formSchemaCustomized !== true) {
            store.formSchema = DEFAULT_FORM_SCHEMA.map((field) => ({ ...field }));
        }
        if (!Array.isArray(store.catalogSections) || !store.catalogSections.length) {
            store.catalogSections = DEFAULT_SECTIONS.map((section) => ({ ...section }));
        }
        if (!store.activeSectionId || !store.catalogSections.some((section) => section.id === store.activeSectionId)) {
            store.activeSectionId = store.catalogSections[0].id;
        }

        store.books.forEach((book) => {
            if (!book.sectionId) book.sectionId = 'books';
        });

        return store;
    }

    function getLibraryCatalogSections() {
        const store = ensureLibraryCatalogState();
        return store.catalogSections.slice();
    }

    function getActiveLibrarySectionId() {
        const store = ensureLibraryCatalogState();
        return String(store.activeSectionId || 'books');
    }

    function setActiveLibrarySectionId(sectionId) {
        const store = ensureLibraryCatalogState();
        const normalized = String(sectionId || '').trim();
        if (!normalized) return false;
        if (!store.catalogSections.some((section) => section.id === normalized)) {
            return false;
        }
        store.activeSectionId = normalized;
        return true;
    }

    function getLibraryFormSchema() {
        const store = ensureLibraryCatalogState();
        const schema = store.formSchema;
        return Array.isArray(schema) ? schema.slice() : [];
    }

    function getLibraryBooksForSection(sectionId = getActiveLibrarySectionId()) {
        const store = ensureLibraryCatalogState();
        const normalized = String(sectionId || getActiveLibrarySectionId());
        return (store.books || []).filter((book) => (
            String(book.sectionId || 'books') === normalized
        ));
    }

    function addLibraryCatalogSection(label) {
        const store = ensureLibraryCatalogState();
        const trimmed = String(label || '').trim();
        if (!trimmed) return null;

        let id = slugifyLibrarySectionId(trimmed);
        const sections = store.catalogSections;
        if (sections.some((section) => section.id === id)) {
            let suffix = 2;
            while (sections.some((section) => section.id === `${id}-${suffix}`)) {
                suffix += 1;
            }
            id = `${id}-${suffix}`;
        }

        sections.push({ id, label: trimmed });
        store.activeSectionId = id;
        return id;
    }

    function removeLibraryCatalogSection(sectionId) {
        const store = ensureLibraryCatalogState();
        const normalized = String(sectionId || '').trim();
        if (!normalized) return null;

        const sectionIndex = store.catalogSections.findIndex((section) => section.id === normalized);
        if (sectionIndex < 0) return null;

        const books = Array.isArray(store.books) ? store.books : [];
        const deletedBookCount = books.filter((book) => (
            String(book.sectionId || 'books') === normalized
        )).length;
        store.books = books.filter((book) => String(book.sectionId || 'books') !== normalized);
        store.catalogSections.splice(sectionIndex, 1);

        if (!store.catalogSections.length) {
            store.catalogSections = DEFAULT_SECTIONS.map((section) => ({ ...section }));
            store.activeSectionId = store.catalogSections[0].id;
        } else if (String(store.activeSectionId || '') === normalized) {
            store.activeSectionId = store.catalogSections[0].id;
        }

        return { removed: true, deletedBookCount, sectionId: normalized };
    }

    function computeLibraryCatalogColSpan(schema, options = {}) {
        const fields = Array.isArray(schema) ? schema : getLibraryFormSchema();
        let span = fields.length;
        if (options.includeAction) span += 1;
        return span;
    }

    function syncLibraryCatalogColgroup(table, schema, options = {}) {
        if (!table) return;
        const fields = Array.isArray(schema) ? schema : getLibraryFormSchema();
        let colgroup = table.querySelector('colgroup');
        if (!colgroup) {
            colgroup = document.createElement('colgroup');
            table.insertBefore(colgroup, table.firstChild);
        }
        const fragment = document.createDocumentFragment();
        const columnCount = fields.length + (options.includeAction ? 1 : 0);
        const columnWidth = columnCount > 0 ? `${100 / columnCount}%` : 'auto';

        fields.forEach(() => {
            const col = document.createElement('col');
            col.style.width = columnWidth;
            fragment.appendChild(col);
        });

        if (options.includeAction) {
            const actionCol = document.createElement('col');
            actionCol.style.width = columnWidth;
            fragment.appendChild(actionCol);
        }

        colgroup.replaceChildren(fragment);
    }

    function syncLibraryCatalogTableMinWidth(table, schema, options = {}) {
        if (!table) return;
        const fields = Array.isArray(schema) ? schema : getLibraryFormSchema();
        const actionWidth = options.includeAction ? 120 : 0;
        const minWidth = 180 + (fields.length * 120) + actionWidth;
        table.style.minWidth = `${minWidth}px`;
    }

    function createLibraryCatalogValueCell(value, field, cellClassPrefix, linkClassName, pdfCellClass) {
        const cell = document.createElement('td');
        const prefix = cellClassPrefix || 'library';
        cell.className = `${prefix}-catalog-cell`;

        const raw = value === null || value === undefined || value === '' ? '-' : String(value);
        const isLinkField = field && (field.id === 'pdfLink' || field.type === 'url');

        if (field && field.type === 'droplist') {
            cell.classList.add(`${prefix}-droplist-data-cell`);
        }

        if (isLinkField && raw !== '-') {
            cell.className = pdfCellClass || `${prefix}-catalog-pdf-cell`;
            if (!pdfCellClass) {
                cell.classList.add(`${prefix}-catalog-cell`);
            }
            const link = document.createElement('a');
            link.href = raw;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = linkClassName || `${prefix}-pdf-link ${prefix}-catalog-pdf-link`;
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-pdf';
            link.appendChild(icon);
            cell.appendChild(link);
            return cell;
        }

        cell.textContent = raw;
        return cell;
    }

    function renderLibraryCatalogTableHead(theadRow, schema, options = {}) {
        if (!theadRow) return;
        const fields = Array.isArray(schema) ? schema : getLibraryFormSchema();
        const fragment = document.createDocumentFragment();

        fields.forEach((field) => {
            const th = document.createElement('th');
            th.textContent = field.label;
            fragment.appendChild(th);
        });

        if (options.includeAction && typeof options.createActionHeader === 'function') {
            fragment.appendChild(options.createActionHeader());
        }

        theadRow.replaceChildren(fragment);

        if (options.table) {
            syncLibraryCatalogTableMinWidth(options.table, fields, options);
            syncLibraryCatalogColgroup(options.table, fields, options);
        }
    }

    function renderLibraryCatalogRow(book, schema, options = {}) {
        const fields = Array.isArray(schema) ? schema : getLibraryFormSchema();
        const row = document.createElement('tr');
        const rowClass = options.rowClassName || 'library-catalog-row';
        const cellClassPrefix = options.cellClassPrefix || 'library';
        row.className = rowClass;

        const index = Number(options.rowIndex || 0);

        fields.forEach((field) => {
            const value = book[field.id];
            row.appendChild(createLibraryCatalogValueCell(
                value === null || value === undefined || value === '' ? '-' : value,
                field,
                cellClassPrefix,
                options.linkClassName,
                options.pdfCellClass
            ));
        });

        if (options.includeAction && typeof options.createActionCell === 'function') {
            row.appendChild(options.createActionCell(book));
        }

        return row;
    }

    function renderLibraryCatalogTabs(host, options = {}) {
        if (!host) return;
        const mode = options.mode === 'admin' ? 'admin' : 'readonly';
        const sections = getLibraryCatalogSections();
        const activeId = String(options.activeId || getActiveLibrarySectionId());
        const fragment = document.createDocumentFragment();

        sections.forEach((section) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'lux-tab-fill lux-select-card lux-tab-btn';
            if (mode === 'admin') {
                button.classList.add('admin-library-tab-btn');
            } else {
                button.classList.add('library-tab-fill', 'tab');
            }
            if (section.id === activeId) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.setAttribute('aria-pressed', 'false');
            }
            button.dataset.libraryCatalogSection = section.id;
            button.textContent = section.label;
            button.addEventListener('click', () => {
                if (!setActiveLibrarySectionId(section.id)) return;
                renderLibraryCatalogTabs(host, { ...options, activeId: section.id });
                if (typeof options.onSelect === 'function') {
                    options.onSelect(section.id);
                }
            });
            fragment.appendChild(button);
        });

        if (mode === 'admin') {
            const manageButton = document.createElement('button');
            manageButton.type = 'button';
            manageButton.className = 'lux-secondary-btn admin-library-manage-sections-btn';
            manageButton.dataset.adminLibraryOpenSectionsManager = 'true';
            manageButton.innerHTML = '<i class="fas fa-layer-group"></i> Manage sections';
            fragment.appendChild(manageButton);
        }

        host.replaceChildren(fragment);
    }

    global.ensureLibraryCatalogState = ensureLibraryCatalogState;
    global.getLibraryCatalogSections = getLibraryCatalogSections;
    global.getActiveLibrarySectionId = getActiveLibrarySectionId;
    global.setActiveLibrarySectionId = setActiveLibrarySectionId;
    global.getLibraryFormSchema = getLibraryFormSchema;
    global.getLibraryBooksForSection = getLibraryBooksForSection;
    global.addLibraryCatalogSection = addLibraryCatalogSection;
    global.removeLibraryCatalogSection = removeLibraryCatalogSection;
    global.computeLibraryCatalogColSpan = computeLibraryCatalogColSpan;
    global.syncLibraryCatalogColgroup = syncLibraryCatalogColgroup;
    global.syncLibraryCatalogTableMinWidth = syncLibraryCatalogTableMinWidth;
    global.renderLibraryCatalogTabs = renderLibraryCatalogTabs;
    global.renderLibraryCatalogTableHead = renderLibraryCatalogTableHead;
    global.renderLibraryCatalogRow = renderLibraryCatalogRow;
    global.slugifyLibrarySectionId = slugifyLibrarySectionId;
})(typeof window !== 'undefined' ? window : globalThis);
