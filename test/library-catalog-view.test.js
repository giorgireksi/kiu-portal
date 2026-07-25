import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function runLibraryCatalogView(stateOverrides = {}, documentHtml = '<tbody id="book-catalog-body"></tbody>') {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${documentHtml}</body></html>`);
    const win = dom.window;
    const adminLibrary = {
        books: [],
        catalogSections: [{ id: 'books', label: 'Books' }],
        formSchema: [{ id: 'title', label: 'Title', type: 'text' }],
        params: { topic: [], language: [], status: [] },
        droplistFilters: {},
        catalogPageSize: 25,
        catalogPageIndex: 0,
        ...stateOverrides
    };
    win.KIU_STATE = { adminLibrary };
    win.getActiveLibrarySectionId = () => 'books';
    win.getLibraryBooksForSection = (sectionId) =>
        (win.KIU_STATE.adminLibrary.books || []).filter(
            (book) => String(book.sectionId || 'books') === sectionId
        );
    win.getLibraryFormSchema = () => win.KIU_STATE.adminLibrary.formSchema.slice();
    win.ensureLibraryCatalogState = () => {};
    const sandbox = { window: win, globalThis: win, document: win.document };
    vm.createContext(sandbox);
    vm.runInContext(readSource('assets/js/shared/library-catalog-view.js'), sandbox, {
        filename: 'library-catalog-view.js'
    });
    return { window: win, document: win.document };
}

describe('library catalog view', () => {
    it('exposes mode-aware readonly and admin catalog orchestration', () => {
        const source = readSource('assets/js/shared/library-catalog-view.js');

        expect(source).toContain('global.LibraryCatalogView = LibraryCatalogView');
        expect(source).toContain('function normalizeMode(mode)');
        expect(source).toContain('includeAction: normalized === \'admin\'');
        expect(source).toContain('persistPagination: normalized === \'admin\'');
        expect(source).toContain('READONLY_SHELL_MARKUP');
        expect(source).toContain('data-library-catalog-shell="1"');
        expect(source).toContain('library-status-pill');
        expect(source).toContain('id="book-catalog-body"');
        expect(source).toContain('id="admin-library-catalog-tabs"');
        expect(source).toContain('id="admin-library-catalog-pagination"');
        expect(source).toContain('READONLY_PAGINATION_KEY');
        expect(source).toContain('sessionStorage');
        expect(source).toContain('renderCatalogTable({ mode })');
        expect(source).toContain('function bindCatalogInteractions(options = {})');
        expect(source).not.toContain('data-admin-library-open-sections-manager');
        expect(source).not.toContain('data-admin-library-add-book');
        expect(source).toContain('if (getModeOptions(mode).persistPagination && typeof global.saveState === \'function\')');
    });

    it('wires readonly library page through the shared view module', () => {
        const html = readSource('library.html');
        const pageScript = readSource('assets/js/pages/library.js');

        expect(html).toContain('assets/js/shared/library-catalog-view.js');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('library-catalog-shared.css');
        expect(html).not.toContain('library-route.css');
        expect(readSource('admin-library.html')).toContain('assets/js/shared/library-catalog-view.js');
        expect(readSource('admin-library.html')).toContain('assets/js/pages/admin-library.js');
        expect(pageScript).toContain('LibraryCatalogView.renderCatalogShell');
        expect(pageScript).toContain('LibraryCatalogView.bindCatalogInteractions({ mode: \'readonly\' })');
        expect(pageScript).toContain('LibraryCatalogView.renderCatalogTable({ mode: \'readonly\' })');
        expect(pageScript).not.toContain('library-page-hero');
        expect(pageScript).not.toContain('LIBRARY_PAGE_SHELL_MARKUP');
    });

    it('invalidates catalog signatures when catalogSections change', () => {
        const source = readSource('assets/js/shared/library-catalog-view.js');
        expect(source).toMatch(/library\.catalogSections/);
        expect(source).toMatch(/adminLibrary\?\.catalogSections/);
        expect(source).not.toMatch(/library\.sections\b/);
        expect(source).not.toMatch(/adminLibrary\?\.sections\b/);

        const { window } = runLibraryCatalogView({
            books: [{ id: 'b1', title: 'Alpha', sectionId: 'books' }],
            catalogSections: [{ id: 'books', label: 'Books' }]
        });
        const before = window.LibraryCatalogView.buildCatalogDataSignature();

        window.KIU_STATE.adminLibrary.catalogSections = [
            { id: 'books', label: 'Books' },
            { id: 'journals', label: 'Journals' }
        ];
        const after = window.LibraryCatalogView.buildCatalogDataSignature();
        expect(after).not.toBe(before);

        // Wrong key must not drive the signature (regression for sections → catalogSections).
        window.KIU_STATE.adminLibrary.sections = [{ id: 'ghost', label: 'Ghost' }];
        expect(window.LibraryCatalogView.buildCatalogDataSignature()).toBe(after);
    });

    it('beginRenderPass passes mode then books to filterBooksForMode so admin droplist filters apply', () => {
        const source = readSource('assets/js/shared/library-catalog-view.js');
        expect(source).toMatch(/filterBooksForMode\(normalizedMode,\s*books\)/);
        expect(source).not.toMatch(/filterBooksForMode\(books,\s*normalizedMode\)/);

        const { window, document } = runLibraryCatalogView(
            {
                formSchema: [
                    { id: 'title', label: 'Title', type: 'text' },
                    { id: 'genre', label: 'Genre', type: 'droplist', options: ['Fiction', 'Poetry'] }
                ],
                books: [
                    { id: 'b1', title: 'Novel', genre: 'Fiction', sectionId: 'books' },
                    { id: 'b2', title: 'Verse', genre: 'Poetry', sectionId: 'books' }
                ],
                droplistFilters: { genre: 'Poetry' }
            },
            `
                <strong id="admin-library-filtered-metric">0</strong>
                <table class="admin-library-catalog-table"><thead><tr></tr></thead>
                <tbody id="book-catalog-body"></tbody></table>
            `
        );

        window.LibraryCatalogView.renderCatalogTable({ mode: 'admin', force: true });

        expect(document.getElementById('admin-library-filtered-metric').textContent).toBe('1');
        expect(document.querySelectorAll('#book-catalog-body tr.admin-library-catalog-row')).toHaveLength(1);
        expect(document.querySelector('#book-catalog-body tr.admin-library-catalog-row td')?.textContent).toBe('Verse');
    });
});
