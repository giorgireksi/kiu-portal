import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function runLibraryCatalogSync(context = {}) {
    const sandbox = {
        KIU_STATE: { adminLibrary: {} },
        __KIU_PORTAL_BOOTSTRAP_PENDING: true,
        ...context
    };
    vm.createContext(sandbox);
    vm.runInContext(readSource('assets/js/shared/library-catalog-sync.js'), sandbox);
    return sandbox;
}

describe('library catalog sync', () => {
    it('preserves custom formSchema and renders dynamic table headers', () => {
        const source = readSource('assets/js/shared/library-catalog-sync.js');

        expect(source).toContain('formSchemaCustomized');
        expect(source).toContain('global.ensureLibraryCatalogState');
        expect(source).toContain('global.renderLibraryCatalogTableHead = renderLibraryCatalogTableHead');
        expect(source).toMatch(/function renderLibraryCatalogTableHead\(theadRow, schema, options = \{\}\)/);
        expect(source).toMatch(/fields\.forEach\(\(field\) => \{[\s\S]*th\.textContent = field\.label/);
    });

    it('always seeds defaults into the store when empty', () => {
        const sandbox = runLibraryCatalogSync();
        expect(() => sandbox.getLibraryFormSchema()).not.toThrow();
        expect(sandbox.getLibraryFormSchema().length).toBeGreaterThan(0);
        expect(sandbox.getLibraryFormSchema().some((field) => field.id === 'title')).toBe(true);
        expect(sandbox.KIU_STATE.adminLibrary.formSchema.length).toBeGreaterThan(0);
        expect(sandbox.getLibraryBrowseFilterFieldIds()).toEqual(
            expect.arrayContaining(['thematic', 'language', 'status'])
        );
    });

    it('prunes browseFilterFieldIds when schema fields are removed', () => {
        const sandbox = runLibraryCatalogSync({
            KIU_STATE: {
                adminLibrary: {
                    formSchema: [
                        { id: 'title', label: 'Title', type: 'text' },
                        { id: 'language', label: 'Language', type: 'select', paramKey: 'language' }
                    ],
                    formSchemaCustomized: true,
                    browseFilterFieldIds: ['language', 'status', 'ghost'],
                    params: {},
                    books: []
                }
            }
        });
        expect(sandbox.getLibraryBrowseFilterFieldIds()).toEqual(['language']);
        sandbox.enableLibraryBrowseFilterField('language');
        expect(sandbox.getLibraryBrowseFilterFieldIds()).toEqual(['language']);
    });

    it('does not re-seed defaults when customized schema is intentionally empty', () => {
        const sandbox = runLibraryCatalogSync({
            KIU_STATE: {
                adminLibrary: {
                    formSchema: [],
                    formSchemaCustomized: true,
                    params: {},
                    books: []
                }
            }
        });
        expect(sandbox.KIU_STATE.adminLibrary.formSchema).toEqual([]);
    });

    it('seeds default schema after bootstrap completes', () => {
        const sandbox = runLibraryCatalogSync();
        sandbox.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
        const schema = sandbox.getLibraryFormSchema();
        expect(schema.length).toBeGreaterThan(0);
        expect(schema.some((field) => field.id === 'title')).toBe(true);
    });

    it('computes catalog colspan from schema fields plus optional action column', () => {
        const sandbox = runLibraryCatalogSync();
        const schema = [
            { id: 'asdda', label: 'asdda', type: 'droplist' },
            { id: 'test', label: 'test', type: 'text' },
            { id: 'test2', label: 'test2', type: 'text' },
            { id: 'test3', label: 'test3', type: 'text' },
            { id: 'test4', label: 'test4', type: 'text' },
            { id: 'test5', label: 'test5', type: 'text' }
        ];

        expect(sandbox.computeLibraryCatalogColSpan(schema, { includeAction: true })).toBe(7);
        expect(sandbox.computeLibraryCatalogColSpan(schema, { includeAction: false })).toBe(6);
    });

    it('removes catalog sections and deletes books in the removed section', () => {
        const sandbox = runLibraryCatalogSync({
            KIU_STATE: {
                adminLibrary: {
                    catalogSections: [
                        { id: 'books', label: 'Books' },
                        { id: 'asd', label: 'asd' }
                    ],
                    activeSectionId: 'asd',
                    books: [
                        { id: '1', title: 'A', sectionId: 'asd' },
                        { id: '2', title: 'B', sectionId: 'books' }
                    ],
                    formSchema: [],
                    params: {}
                }
            }
        });

        const result = sandbox.removeLibraryCatalogSection('asd');
        expect(result).toEqual({ removed: true, deletedBookCount: 1, sectionId: 'asd' });
        expect(sandbox.KIU_STATE.adminLibrary.catalogSections).toEqual([{ id: 'books', label: 'Books' }]);
        expect(sandbox.KIU_STATE.adminLibrary.books).toEqual([{ id: '2', title: 'B', sectionId: 'books' }]);
        expect(sandbox.KIU_STATE.adminLibrary.activeSectionId).toBe('books');
    });

    it('re-seeds default Books section when the last section is removed', () => {
        const sandbox = runLibraryCatalogSync({
            KIU_STATE: {
                adminLibrary: {
                    catalogSections: [{ id: 'books', label: 'Books' }],
                    activeSectionId: 'books',
                    books: [{ id: '1', title: 'A', sectionId: 'books' }],
                    formSchema: [],
                    params: {}
                }
            }
        });

        sandbox.removeLibraryCatalogSection('books');
        expect(sandbox.KIU_STATE.adminLibrary.catalogSections).toEqual([{ id: 'books', label: 'Books' }]);
        expect(sandbox.KIU_STATE.adminLibrary.activeSectionId).toBe('books');
        expect(sandbox.KIU_STATE.adminLibrary.books).toEqual([]);
    });

    it('renders manage sections button in admin tab strip', () => {
        const source = readSource('assets/js/shared/library-catalog-sync.js');
        expect(source).toContain('admin-library-manage-sections-btn home-hover-chip');
        expect(source).toContain("button.classList.add('home-hover-chip')");
        expect(source).toContain('adminLibraryOpenSectionsManager');
        expect(source).toContain('Manage sections');
        expect(source).not.toContain('admin-library-add-section-btn');
    });

    it('exports catalog colgroup sync with equal column widths', () => {
        const source = readSource('assets/js/shared/library-catalog-sync.js');
        const sandbox = runLibraryCatalogSync();

        expect(source).toContain('function syncLibraryCatalogColgroup(table, schema, options = {})');
        expect(source).toContain('col.style.width = columnWidth');
        expect(source).toContain('`${100 / columnCount}%`');
        expect(sandbox.syncLibraryCatalogColgroup).toBeTypeOf('function');
    });
});
