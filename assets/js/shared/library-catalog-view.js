(function initLibraryCatalogView(global) {
    'use strict';

    const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 320];
    const READONLY_PAGINATION_KEY = 'library-catalog-readonly-pagination';

    const runtime = {
        boundModes: new Set(),
        readonlyDroplistFilters: {},
        readonlyPagination: { pageSize: 25, pageIndex: 0 },
        lastDataSignature: '',
        filterDebounceTimer: 0,
        renderPass: null
    };

    const READONLY_SHELL_MARKUP = `
        <div class="library-catalog-workspace" data-library-catalog-shell="1" data-lux-glass-root="1">
            <section class="library-catalog-filters-panel lux-soft-chrome home-hover-chip">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-card-title">Browse Catalog</div>
                        <div class="lux-card-meta">Search and filter the shared library shelf.</div>
                    </div>
                </div>
                <div class="admin-library-metric-row admin-library-metric-row--compact">
                    <div class="lux-stat-card admin-library-metric-card home-hover-chip">
                        <span class="admin-library-metric-label">Catalog Entries</span>
                        <strong id="admin-library-total-metric" class="admin-library-metric-value">0</strong>
                    </div>
                    <div class="lux-stat-card admin-library-metric-card home-hover-chip">
                        <span class="admin-library-metric-label">Visible View</span>
                        <strong id="admin-library-filtered-metric" class="admin-library-metric-value">0</strong>
                    </div>
                </div>
                <div class="alib-filter-stack">
                    <label class="lux-picker-field">
                        <span class="lux-picker-label">Search</span>
                        <input id="library-filter-search" name="library_filter_search" type="text" class="lux-control" placeholder="Title, author, year..." data-library-catalog-search="query">
                    </label>
                    <div data-library-catalog-filter-fields style="display:contents"></div>
                </div>
            </section>
            <section class="lux-strip-card admin-library-catalog-card lux-soft-chrome home-hover-chip" aria-label="Shared catalog">
                <div class="admin-library-catalog-head">
                    <div class="admin-library-catalog-tabs-rail lux-scroll-rail lux-scroll-rail--horizontal" data-lux-scroll-rail data-admin-library-catalog-tabs-rail="true" data-lux-scroll-axis="horizontal">
                        <div class="lux-scroll-rail__controls admin-library-catalog-tabs-rail__controls admin-library-catalog-tabs-rail__controls--start" hidden aria-hidden="true">
                            <div class="lux-scroll-rail__dock" role="group" aria-label="Scroll catalog sections">
                                <button type="button" class="lux-scroll-rail__btn lux-modern-button" data-lux-scroll="left" data-lux-button-tone="secondary" aria-label="Scroll catalog sections left"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
                            </div>
                        </div>
                        <div class="lux-scrollbar lux-scroll-rail__viewport admin-library-catalog-tabs-viewport" aria-label="Catalog sections">
                            <div class="lux-tab-strip admin-library-tabs" id="admin-library-catalog-tabs"></div>
                        </div>
                        <div class="lux-scroll-rail__controls admin-library-catalog-tabs-rail__controls admin-library-catalog-tabs-rail__controls--end" hidden aria-hidden="true">
                            <div class="lux-scroll-rail__dock" role="group" aria-label="Scroll catalog sections">
                                <button type="button" class="lux-scroll-rail__btn lux-modern-button" data-lux-scroll="right" data-lux-button-tone="secondary" aria-label="Scroll catalog sections right"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
                            </div>
                        </div>
                    </div>
                    <span class="lux-pill library-status-pill home-hover-chip"><i class="fas fa-lock"></i> Read-only catalog</span>
                </div>
                <div class="admin-library-scroll-wrap">
                    <table class="kiu-table admin-library-catalog-table">
                        <thead><tr></tr></thead>
                        <tbody id="book-catalog-body"></tbody>
                    </table>
                </div>
                <div class="admin-library-catalog-foot">
                    <div class="admin-library-catalog-foot-meta">
                        <span id="shared-library-count">0 books</span>
                        <span id="admin-library-filtered-summary">0 visible in current view</span>
                    </div>
                    <div class="admin-library-catalog-pagination" id="admin-library-catalog-pagination" hidden>
                        <label class="admin-library-catalog-page-size-field" for="admin-library-catalog-page-size">
                            <span class="admin-library-catalog-page-size-label">Items per page</span>
                            <select id="admin-library-catalog-page-size" name="admin_library_catalog_page_size" class="lux-control admin-library-catalog-page-size-select" data-admin-library-catalog-page-size="true">
                                <option value="10">10</option>
                                <option value="25" selected>25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="250">250</option>
                                <option value="320">320</option>
                            </select>
                        </label>
                        <div class="admin-library-catalog-page-controls">
                            <span id="admin-library-catalog-page-range" class="admin-library-catalog-page-range">0 - 0 of 0</span>
                            <div class="admin-library-catalog-page-nav" role="group" aria-label="Catalog page navigation">
                                <button type="button" class="lux-secondary-btn admin-library-catalog-page-btn" data-admin-library-catalog-page="prev" data-lux-button-tone="secondary" aria-label="Previous page" disabled>
                                    <i class="fas fa-chevron-left" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="lux-secondary-btn admin-library-catalog-page-btn" data-admin-library-catalog-page="next" data-lux-button-tone="secondary" aria-label="Next page" disabled>
                                    <i class="fas fa-chevron-right" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;

    function normalizeMode(mode) {
        return mode === 'admin' ? 'admin' : 'readonly';
    }

    function getModeOptions(mode) {
        const normalized = normalizeMode(mode);
        return {
            mode: normalized,
            includeAction: normalized === 'admin',
            allowMutations: normalized === 'admin',
            persistPagination: normalized === 'admin',
            tabsMode: normalized
        };
    }

    function ensureCatalogState() {
        if (typeof global.ensureLibraryCatalogState === 'function') {
            global.ensureLibraryCatalogState();
            return;
        }
        if (!global.KIU_STATE) global.KIU_STATE = {};
        if (!global.KIU_STATE.adminLibrary) global.KIU_STATE.adminLibrary = {};
    }

    function getFormSchema() {
        ensureCatalogState();
        if (typeof global.getLibraryFormSchema === 'function') {
            return global.getLibraryFormSchema();
        }
        if (typeof global.getAdminLibraryFormSchema === 'function') {
            return global.getAdminLibraryFormSchema();
        }
        return Array.isArray(global.KIU_STATE?.adminLibrary?.formSchema)
            ? global.KIU_STATE.adminLibrary.formSchema.slice()
            : [];
    }

    function isFilterableSchemaField(field) {
        if (typeof global.isLibraryFilterableSchemaField === 'function') {
            return global.isLibraryFilterableSchemaField(field);
        }
        const type = String(field?.type || '');
        return type === 'select' || type === 'droplist';
    }

    function getFilterableSchemaFields() {
        return getFormSchema().filter(isFilterableSchemaField);
    }

    function getBrowseFilterFieldIds() {
        ensureCatalogState();
        if (typeof global.getLibraryBrowseFilterFieldIds === 'function') {
            return global.getLibraryBrowseFilterFieldIds();
        }
        if (typeof global.normalizeLibraryBrowseFilterFieldIds === 'function') {
            return global.normalizeLibraryBrowseFilterFieldIds();
        }
        const store = global.KIU_STATE?.adminLibrary || {};
        const filterableIds = getFilterableSchemaFields().map((field) => String(field.id || '').trim()).filter(Boolean);
        if (!Array.isArray(store.browseFilterFieldIds)) {
            store.browseFilterFieldIds = filterableIds.slice();
        } else {
            const allowed = new Set(filterableIds);
            store.browseFilterFieldIds = store.browseFilterFieldIds
                .map((id) => String(id || '').trim())
                .filter((id) => id && allowed.has(id));
        }
        return store.browseFilterFieldIds.slice();
    }

    function getBrowseFilterSchemaFields() {
        const enabled = new Set(getBrowseFilterFieldIds());
        return getFilterableSchemaFields().filter((field) => enabled.has(String(field.id || '')));
    }

    function getVisibleFilterSchemaFields(mode) {
        return normalizeMode(mode) === 'admin'
            ? getFilterableSchemaFields()
            : getBrowseFilterSchemaFields();
    }

    function getSchemaFieldFilterOptions(field) {
        if (Array.isArray(field?.options) && field.options.length) return field.options;
        const params = global.KIU_STATE?.adminLibrary?.params || {};
        if (field?.paramKey && Array.isArray(params[field.paramKey])) return params[field.paramKey];
        return [];
    }

    function readSchemaFilterValues(mode) {
        const values = {};
        getVisibleFilterSchemaFields(mode).forEach((field) => {
            const select = global.document.getElementById(`library-filter-${field.id}`);
            values[field.id] = select?.value || 'all';
        });
        return values;
    }

    function loadReadonlyPagination() {
        try {
            const raw = global.sessionStorage?.getItem(READONLY_PAGINATION_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const pageSize = Number.parseInt(String(parsed?.pageSize ?? ''), 10);
            const pageIndex = Number.parseInt(String(parsed?.pageIndex ?? ''), 10);
            if (PAGE_SIZE_OPTIONS.includes(pageSize)) runtime.readonlyPagination.pageSize = pageSize;
            if (Number.isFinite(pageIndex) && pageIndex >= 0) runtime.readonlyPagination.pageIndex = pageIndex;
        } catch (error) {
            /* ignore */
        }
    }

    function saveReadonlyPagination() {
        try {
            global.sessionStorage?.setItem(READONLY_PAGINATION_KEY, JSON.stringify(runtime.readonlyPagination));
        } catch (error) {
            /* ignore */
        }
    }

    function getCatalogPageSize(mode) {
        const options = getModeOptions(mode);
        if (options.persistPagination) {
            ensureCatalogState();
            const stored = Number.parseInt(String(global.KIU_STATE.adminLibrary.catalogPageSize ?? ''), 10);
            if (PAGE_SIZE_OPTIONS.includes(stored)) return stored;
            return 25;
        }
        loadReadonlyPagination();
        return runtime.readonlyPagination.pageSize;
    }

    function setCatalogPageSize(mode, pageSize) {
        const normalized = Number.parseInt(String(pageSize || ''), 10);
        const safeSize = PAGE_SIZE_OPTIONS.includes(normalized) ? normalized : 25;
        const options = getModeOptions(mode);
        if (options.persistPagination) {
            ensureCatalogState();
            global.KIU_STATE.adminLibrary.catalogPageSize = safeSize;
            return;
        }
        runtime.readonlyPagination.pageSize = safeSize;
        saveReadonlyPagination();
    }

    function getCatalogPageIndex(mode) {
        const options = getModeOptions(mode);
        if (options.persistPagination) {
            ensureCatalogState();
            const stored = Number.parseInt(String(global.KIU_STATE.adminLibrary.catalogPageIndex ?? ''), 10);
            return Number.isFinite(stored) && stored >= 0 ? stored : 0;
        }
        loadReadonlyPagination();
        return runtime.readonlyPagination.pageIndex;
    }

    function setCatalogPageIndex(mode, pageIndex) {
        const normalized = Number.parseInt(String(pageIndex ?? ''), 10);
        const safeIndex = Number.isFinite(normalized) && normalized >= 0 ? normalized : 0;
        const options = getModeOptions(mode);
        if (options.persistPagination) {
            ensureCatalogState();
            global.KIU_STATE.adminLibrary.catalogPageIndex = safeIndex;
            return;
        }
        runtime.readonlyPagination.pageIndex = safeIndex;
        saveReadonlyPagination();
    }

    function resetCatalogPage(mode) {
        setCatalogPageIndex(mode, 0);
    }

    function clampCatalogPageIndex(totalItems, pageSize, pageIndex) {
        const safePageSize = Math.max(1, pageSize || 1);
        const maxPageIndex = Math.max(0, Math.ceil(Math.max(0, totalItems) / safePageSize) - 1);
        return Math.min(Math.max(0, pageIndex || 0), maxPageIndex);
    }

    function getDroplistFilters(mode) {
        const options = getModeOptions(mode);
        if (options.persistPagination) {
            ensureCatalogState();
            if (!global.KIU_STATE.adminLibrary.droplistFilters) {
                global.KIU_STATE.adminLibrary.droplistFilters = {};
            }
            return global.KIU_STATE.adminLibrary.droplistFilters;
        }
        return runtime.readonlyDroplistFilters;
    }

    function setDroplistFilter(mode, fieldId, value) {
        const filters = getDroplistFilters(mode);
        filters[fieldId] = value || 'all';
    }

    function buildCatalogDataSignature() {
        const library = global.KIU_STATE?.adminLibrary || {};
        const books = Array.isArray(library.books) ? library.books : [];
        const sections = Array.isArray(library.catalogSections) ? library.catalogSections : [];
        const meta = library.meta && typeof library.meta === 'object' ? library.meta : {};
        const schema = getFormSchema();
        const schemaSig = schema.map((field) => `${field.id}:${field.type || ''}`).join('|');
        const browseFilterSig = getBrowseFilterFieldIds().join(',');
        const sectionSig = sections.map((section) => `${section.id}:${section.label || ''}`).join('|');
        if (!books.length) {
            return `0::${sectionSig}::${meta.savedAt || meta.updatedAt || ''}::${schemaSig}::${browseFilterSig}`;
        }
        const first = String(books[0]?.id || '');
        const last = String(books[books.length - 1]?.id || '');
        const pivot = books[Math.floor(books.length / 2)] || books[0];
        const pivotStamp = String(pivot?.updatedAt || pivot?.id || '');
        return `${books.length}::${sectionSig}::${meta.savedAt || meta.updatedAt || ''}::${first}::${last}::${pivotStamp}::${schemaSig}::${browseFilterSig}`;
    }

    function resolveSectionBooks(sectionId) {
        return typeof global.getLibraryBooksForSection === 'function'
            ? global.getLibraryBooksForSection(sectionId)
            : (global.KIU_STATE.adminLibrary.books || []).filter((book) => String(book.sectionId || 'books') === sectionId);
    }

    function beginRenderPass(mode) {
        const normalizedMode = normalizeMode(mode);
        const sectionId = typeof global.getActiveLibrarySectionId === 'function'
            ? global.getActiveLibrarySectionId()
            : 'books';
        const books = resolveSectionBooks(sectionId);
        const filteredBooks = filterBooksForMode(normalizedMode, books);
        runtime.renderPass = { sectionId, books, filteredBooks };
    }

    function endRenderPass() {
        runtime.renderPass = null;
    }

    function getCatalogViewState(mode) {
        const normalizedMode = normalizeMode(mode);
        if (runtime.renderPass) {
            const { sectionId, books, filteredBooks } = runtime.renderPass;
            const pageSize = getCatalogPageSize(normalizedMode);
            const pageIndex = clampCatalogPageIndex(filteredBooks.length, pageSize, getCatalogPageIndex(normalizedMode));
            const pageStart = pageIndex * pageSize;
            const pagedBooks = filteredBooks.slice(pageStart, pageStart + pageSize);
            const q = (global.document.getElementById('library-filter-search')?.value || '').trim();
            const schemaFilters = readSchemaFilterValues(normalizedMode);
            return {
                sectionId,
                books,
                filteredBooks,
                pageSize,
                pageIndex,
                pageStart,
                pagedBooks,
                q,
                schemaFilters
            };
        }
        const sectionId = typeof global.getActiveLibrarySectionId === 'function'
            ? global.getActiveLibrarySectionId()
            : 'books';
        const books = resolveSectionBooks(sectionId);
        const filteredBooks = getFilteredBooks(normalizedMode, books);
        const pageSize = getCatalogPageSize(normalizedMode);
        const pageIndex = clampCatalogPageIndex(filteredBooks.length, pageSize, getCatalogPageIndex(normalizedMode));
        const pageStart = pageIndex * pageSize;
        const pagedBooks = filteredBooks.slice(pageStart, pageStart + pageSize);
        const q = (global.document.getElementById('library-filter-search')?.value || '').trim();
        const schemaFilters = readSchemaFilterValues(normalizedMode);
        return {
            sectionId,
            books,
            filteredBooks,
            pageSize,
            pageIndex,
            pageStart,
            pagedBooks,
            q,
            schemaFilters
        };
    }

    function buildCatalogRenderSignature(mode, viewState, dataSignature) {
        const state = viewState || getCatalogViewState(mode);
        const pageIds = state.pagedBooks.map((book) => book.id).join(',');
        return [
            mode,
            state.sectionId,
            state.q,
            JSON.stringify(state.schemaFilters || {}),
            state.pageSize,
            state.pageIndex,
            pageIds,
            dataSignature || buildCatalogDataSignature()
        ].join('::');
    }

    function scheduleCatalogTableRender(mode) {
        if (runtime.filterDebounceTimer) {
            global.clearTimeout(runtime.filterDebounceTimer);
        }
        runtime.filterDebounceTimer = global.setTimeout(() => {
            runtime.filterDebounceTimer = 0;
            renderCatalogTable({ mode });
        }, 120);
    }

    function filterBooksForMode(mode, sourceBooks) {
        ensureCatalogState();
        const books = Array.isArray(sourceBooks) ? sourceBooks : resolveSectionBooks(
            typeof global.getActiveLibrarySectionId === 'function'
                ? global.getActiveLibrarySectionId()
                : 'books'
        );
        const q = (global.document.getElementById('library-filter-search')?.value || '').trim().toLowerCase();
        const schemaFilters = readSchemaFilterValues(mode);
        const filterFields = getVisibleFilterSchemaFields(mode);

        return books.filter((book) => {
            const queryMatch = !q
                || String(book.id || '').toLowerCase().includes(q)
                || String(book.title || '').toLowerCase().includes(q)
                || String(book.subtitle || '').toLowerCase().includes(q)
                || String(book.author || '').toLowerCase().includes(q)
                || String(book.year || '').toLowerCase().includes(q)
                || String(book.thematic || '').toLowerCase().includes(q);
            const schemaMatch = filterFields.every((field) => {
                const value = schemaFilters[field.id] || 'all';
                return value === 'all' || String(book[field.id] || '') === value;
            });
            return queryMatch && schemaMatch;
        });
    }

    function getFilteredBooks(mode, sourceBooks = null) {
        if (runtime.renderPass?.filteredBooks && !sourceBooks) {
            return runtime.renderPass.filteredBooks;
        }
        return filterBooksForMode(mode, sourceBooks);
    }

    function createSelectOption(value, label) {
        const option = global.document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    function syncCatalogFilterPickers(root) {
        const scope = root
            || global.document.querySelector('[data-library-catalog-filter-fields]')
            || global.document.querySelector('.alib-filter-stack')
            || global.document.querySelector('.library-catalog-filters-panel .alib-filter-stack');
        if (!scope) return;
        scope.querySelectorAll('[data-library-catalog-filter-field]').forEach((select) => {
            if (select.dataset.luxPickerEnhanced === 'true') return;
            if (typeof global.enhanceUniversalPicker === 'function') {
                global.enhanceUniversalPicker(select);
            }
        });
    }

    function renderCatalogFilters(mode) {
        ensureCatalogState();
        if (typeof global.normalizeLibraryBrowseFilterFieldIds === 'function') {
            global.normalizeLibraryBrowseFilterFieldIds();
        }
        const host = global.document.querySelector('[data-library-catalog-filter-fields]');
        if (!host) return;

        const previous = {};
        host.querySelectorAll('[data-library-catalog-filter-field]').forEach((select) => {
            previous[select.dataset.libraryCatalogFilterField] = select.value;
        });

        const fragment = global.document.createDocumentFragment();
        getVisibleFilterSchemaFields(mode).forEach((field) => {
            const label = global.document.createElement('label');
            label.className = 'lux-picker-field';

            const caption = global.document.createElement('span');
            caption.className = 'lux-picker-label';
            caption.textContent = field.label || field.id;
            label.appendChild(caption);

            const select = global.document.createElement('select');
            select.id = `library-filter-${field.id}`;
            select.name = `library_filter_${field.id}`;
            select.dataset.luxPickerLabel = field.label || field.id;
            select.dataset.libraryCatalogFilterField = field.id;

            const options = getSchemaFieldFilterOptions(field);
            select.appendChild(createSelectOption('all', `All ${field.label || field.id}`));
            options.forEach((item) => {
                select.appendChild(createSelectOption(String(item), String(item)));
            });

            const preferred = previous[field.id] || 'all';
            select.value = options.some((item) => String(item) === preferred) || preferred === 'all'
                ? preferred
                : 'all';

            label.appendChild(select);
            fragment.appendChild(label);
        });

        host.replaceChildren(fragment);
        syncCatalogFilterPickers(host);
    }

    function createActionCell(bookId) {
        const cell = global.document.createElement('td');
        cell.className = 'admin-library-catalog-cell admin-library-action-cell';
        const button = global.document.createElement('button');
        button.className = 'admin-library-remove-btn lux-secondary-btn';
        button.type = 'button';
        button.dataset.adminLibraryRemoveAction = bookId;
        const icon = global.document.createElement('i');
        icon.className = 'fas fa-trash';
        button.appendChild(icon);
        const label = global.document.createElement('span');
        label.textContent = 'Remove';
        button.appendChild(label);
        cell.appendChild(button);
        return cell;
    }

    function createCatalogRow(book, index, mode) {
        const options = getModeOptions(mode);
        const schema = getFormSchema();
        if (typeof global.renderLibraryCatalogRow === 'function') {
            return global.renderLibraryCatalogRow(book, schema, {
                rowClassName: 'admin-library-catalog-row',
                cellClassPrefix: 'admin-library',
                pdfCellClass: 'admin-library-catalog-cell admin-library-pdf-cell',
                linkClassName: 'admin-library-pdf-link',
                rowIndex: index,
                includeAction: options.includeAction,
                createActionCell: options.includeAction
                    ? (entry) => createActionCell(String(entry.id || ''))
                    : undefined
            });
        }
        const row = global.document.createElement('tr');
        row.className = 'admin-library-catalog-row';
        schema.forEach((field) => {
            const value = book[field.id] || '-';
            const cell = global.document.createElement('td');
            cell.className = 'admin-library-catalog-cell';
            cell.textContent = String(value);
            row.appendChild(cell);
        });
        if (options.includeAction) row.appendChild(createActionCell(String(book.id || '')));
        return row;
    }

    function buildCatalogTableHeaderSignature(mode) {
        const schema = getFormSchema();
        return `${normalizeMode(mode)}::${schema.map((field) => `${field.id}:${field.type || ''}`).join('|')}`;
    }

    function renderCatalogTableHeader(mode) {
        const options = getModeOptions(mode);
        const thead = global.document.querySelector('.admin-library-catalog-table thead tr');
        const table = global.document.querySelector('.admin-library-catalog-table');
        if (!thead) return;
        const headerSignature = buildCatalogTableHeaderSignature(mode);
        if (thead.dataset.renderSignature === headerSignature && thead.children.length) return;
        const schema = getFormSchema();
        const createActionHeader = () => {
            const th = global.document.createElement('th');
            th.textContent = 'Action';
            return th;
        };

        if (typeof global.renderLibraryCatalogTableHead === 'function') {
            global.renderLibraryCatalogTableHead(thead, schema, {
                includeAction: options.includeAction,
                table,
                createActionHeader: options.includeAction ? createActionHeader : undefined
            });
            thead.dataset.renderSignature = headerSignature;
            return;
        }

        const fragment = global.document.createDocumentFragment();
        schema.forEach((field) => {
            const th = global.document.createElement('th');
            th.textContent = field.label;
            fragment.appendChild(th);
        });
        if (options.includeAction) fragment.appendChild(createActionHeader());
        thead.replaceChildren(fragment);
        thead.dataset.renderSignature = headerSignature;
        if (table) {
            if (typeof global.syncLibraryCatalogTableMinWidth === 'function') {
                global.syncLibraryCatalogTableMinWidth(table, schema, { includeAction: options.includeAction });
            }
            if (typeof global.syncLibraryCatalogColgroup === 'function') {
                global.syncLibraryCatalogColgroup(table, schema, { includeAction: options.includeAction });
            }
        }
    }

    function renderCatalogPagination(totalItems, mode) {
        const pagination = global.document.getElementById('admin-library-catalog-pagination');
        const pageSizeSelect = global.document.getElementById('admin-library-catalog-page-size');
        const pageRange = global.document.getElementById('admin-library-catalog-page-range');
        const prevBtn = global.document.querySelector('[data-admin-library-catalog-page="prev"]');
        const nextBtn = global.document.querySelector('[data-admin-library-catalog-page="next"]');
        if (!pagination || !pageSizeSelect || !pageRange || !prevBtn || !nextBtn) return;

        const pageSize = getCatalogPageSize(mode);
        const pageIndex = getCatalogPageIndex(mode);
        const safeTotal = Math.max(0, totalItems || 0);
        pageSizeSelect.value = String(pageSize);
        pagination.hidden = safeTotal === 0;
        if (!safeTotal) {
            pageRange.textContent = '0 - 0 of 0';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        const start = (pageIndex * pageSize) + 1;
        const end = Math.min(safeTotal, start + pageSize - 1);
        pageRange.textContent = `${start} - ${end} of ${safeTotal}`;
        prevBtn.disabled = pageIndex <= 0;
        nextBtn.disabled = end >= safeTotal;
    }

    function renderEmptyStateRow(tbody, mode) {
        const options = getModeOptions(mode);
        const schema = getFormSchema();
        const row = global.document.createElement('tr');
        row.className = 'admin-library-empty-row';
        const cell = global.document.createElement('td');
        cell.className = 'admin-library-empty-cell admin-library-catalog-cell';
        const headerCount = global.document.querySelector('.admin-library-catalog-table thead tr')?.children.length;
        cell.colSpan = headerCount
            || (typeof global.computeLibraryCatalogColSpan === 'function'
                ? global.computeLibraryCatalogColSpan(schema, { includeAction: options.includeAction })
                : 10);
        cell.innerHTML = `
            <div class="admin-library-empty-state lux-soft-chrome home-hover-chip">
                <i class="fas fa-book-open"></i>
                <strong class="admin-library-empty-state-title lux-card-title">No books found</strong>
                <span class="admin-library-empty-state-copy lux-card-copy">No catalog entries match the current filters.</span>
            </div>
        `;
        row.appendChild(cell);
        tbody.replaceChildren(row);
    }

    function buildCatalogTabsSignature(mode) {
        const sectionId = typeof global.getActiveLibrarySectionId === 'function'
            ? global.getActiveLibrarySectionId()
            : 'books';
        const sections = global.KIU_STATE?.adminLibrary?.catalogSections || [];
        return `${normalizeMode(mode)}::${sectionId}::${sections.length}::${buildCatalogDataSignature()}`;
    }

    function renderCatalogTabs(mode) {
        const host = global.document.getElementById('admin-library-catalog-tabs');
        if (!host || typeof global.renderLibraryCatalogTabs !== 'function') return;
        const tabsSignature = buildCatalogTabsSignature(mode);
        if (host.dataset.renderSignature === tabsSignature && host.children.length) return;
        const options = getModeOptions(mode);
        global.renderLibraryCatalogTabs(host, {
            mode: options.tabsMode,
            activeId: typeof global.getActiveLibrarySectionId === 'function' ? global.getActiveLibrarySectionId() : 'books',
            onSelect: function onCatalogSectionSelect() {
                resetCatalogPage(mode);
                renderCatalogTable({ mode });
            }
        });
        host.dataset.renderSignature = tabsSignature;
        syncCatalogTabsRail();
    }

    function syncCatalogTabsRail() {
        const scope = global.document;
        if (typeof global.initLuxScrollRail === 'function') {
            global.initLuxScrollRail(scope, { shellSelector: '[data-admin-library-catalog-tabs-rail]' });
        }
        if (typeof global.syncLuxScrollRail === 'function') {
            global.syncLuxScrollRail(scope, { shellSelector: '[data-admin-library-catalog-tabs-rail]' });
        }
    }

    function renderCatalogTable(options = {}) {
        const mode = normalizeMode(options.mode);
        ensureCatalogState();
        const tbody = global.document.getElementById('book-catalog-body');
        if (!tbody) return;

        beginRenderPass(mode);
        try {
            const dataSignature = buildCatalogDataSignature();
            const viewState = getCatalogViewState(mode);
            if (viewState.pageIndex !== getCatalogPageIndex(mode)) {
                setCatalogPageIndex(mode, viewState.pageIndex);
            }
            const renderSignature = buildCatalogRenderSignature(mode, viewState, dataSignature);
            if (!options.force && tbody.dataset.renderSignature === renderSignature) {
                return;
            }

            renderCatalogTabs(mode);
            renderCatalogTableHeader(mode);

            const { books, filteredBooks, pageStart, pagedBooks } = viewState;
            const visibleBooks = filteredBooks.length;

            const totalMetric = global.document.getElementById('admin-library-total-metric');
            const filteredMetric = global.document.getElementById('admin-library-filtered-metric');
            const totalCount = global.document.getElementById('shared-library-count');
            const filteredSummary = global.document.getElementById('admin-library-filtered-summary');
            if (totalMetric) totalMetric.textContent = String(books.length);
            if (filteredMetric) filteredMetric.textContent = String(visibleBooks);
            if (totalCount) totalCount.textContent = `${books.length} book${books.length === 1 ? '' : 's'}`;
            if (filteredSummary) filteredSummary.textContent = `${visibleBooks} visible in current view`;

            renderCatalogPagination(visibleBooks, mode);

            if (!filteredBooks.length) {
                renderEmptyStateRow(tbody, mode);
                tbody.dataset.renderSignature = renderSignature;
                runtime.lastDataSignature = dataSignature;
                return;
            }

            const fragment = global.document.createDocumentFragment();
            pagedBooks.forEach((book, index) => {
                fragment.appendChild(createCatalogRow(book, pageStart + index, mode));
            });
            tbody.replaceChildren(fragment);
            tbody.dataset.renderSignature = renderSignature;
            runtime.lastDataSignature = dataSignature;
        } finally {
            endRenderPass();
        }
    }

    function refreshCatalogDataIfChanged(mode) {
        const nextDataSignature = buildCatalogDataSignature();
        if (nextDataSignature === runtime.lastDataSignature) return;
        renderCatalogTable({ mode: normalizeMode(mode), force: true });
    }

    function renderCatalogShell(host, options = {}) {
        const mode = normalizeMode(options.mode);
        if (!host) return null;
        if (mode === 'readonly') {
            if (host.querySelector('[data-library-catalog-shell="1"]')) return host;
            host.innerHTML = READONLY_SHELL_MARKUP;
        }
        return host;
    }

    function bindCatalogInteractions(options = {}) {
        const mode = normalizeMode(options.mode);
        const bindingKey = `${mode}-catalog`;
        if (runtime.boundModes.has(bindingKey)) return;
        runtime.boundModes.add(bindingKey);

        const search = global.document.getElementById('library-filter-search');
        if (search) {
            search.addEventListener('input', () => {
                resetCatalogPage(mode);
                scheduleCatalogTableRender(mode);
            });
        }

        const pageSizeSelect = global.document.getElementById('admin-library-catalog-page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => {
                setCatalogPageSize(mode, Number.parseInt(pageSizeSelect.value || '25', 10));
                resetCatalogPage(mode);
                renderCatalogTable({ mode });
            });
        }

        global.document.addEventListener('change', (event) => {
            const filterSelect = event.target?.closest?.('[data-library-catalog-filter-field]');
            if (!filterSelect) return;
            const fieldId = filterSelect.dataset.libraryCatalogFilterField;
            if (fieldId) setDroplistFilter(mode, fieldId, filterSelect.value);
            if (getModeOptions(mode).persistPagination && typeof global.saveState === 'function') {
                global.saveState();
            }
            resetCatalogPage(mode);
            renderCatalogTable({ mode });
        });

        global.document.addEventListener('click', (event) => {
            const catalogPageNav = event.target.closest('[data-admin-library-catalog-page]');
            if (catalogPageNav && !catalogPageNav.disabled) {
                const direction = catalogPageNav.dataset.adminLibraryCatalogPage;
                if (direction === 'prev') {
                    setCatalogPageIndex(mode, getCatalogPageIndex(mode) - 1);
                } else if (direction === 'next') {
                    setCatalogPageIndex(mode, getCatalogPageIndex(mode) + 1);
                }
                renderCatalogTable({ mode });
            }
        });
    }

    const LibraryCatalogView = {
        getModeOptions,
        getFilteredBooks,
        getCatalogPageSize,
        setCatalogPageSize,
        getCatalogPageIndex,
        setCatalogPageIndex,
        resetCatalogPage,
        clampCatalogPageIndex,
        getDroplistFilters,
        setDroplistFilter,
        renderCatalogShell,
        renderCatalogFilters,
        syncCatalogFilterPickers,
        renderCatalogTabs,
        syncCatalogTabsRail,
        renderCatalogTableHeader,
        renderCatalogTable,
        renderCatalogPagination,
        bindCatalogInteractions,
        refreshCatalogDataIfChanged,
        buildCatalogDataSignature,
        PAGE_SIZE_OPTIONS
    };

    global.LibraryCatalogView = LibraryCatalogView;
    global.renderLibraryCatalogTable = renderCatalogTable;
    global.syncLibraryCatalogTabsRail = syncCatalogTabsRail;
})(typeof window !== 'undefined' ? window : globalThis);