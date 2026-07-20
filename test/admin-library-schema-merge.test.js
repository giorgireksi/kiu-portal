import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadMergeAdminLibraryState() {
    const peelSource = readSource('assets/js/app/api-admin-merge-runtime.js');
    const persistSource = readSource('assets/js/app/api-portal-persist-runtime.js');
    const vm = require('vm');
    const context = { console };
    vm.createContext(context);
    const helpers = [
        persistSource.match(/function clonePortalState[\s\S]*?\n\}/)?.[0],
        peelSource.match(/const DEFAULT_ADMIN_LIBRARY_FORM_SCHEMA_IDS = [\s\S]*?\];/)?.[0],
        peelSource.match(/function isDefaultAdminLibraryFormSchema[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function getAdminLibraryFormSchemaFieldSignature[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function mergeAdminLibraryParamArrays[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function getAdminLibraryBookFreshness[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function pickPreferredAdminLibraryBook[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function mergeAdminLibraryCatalogSections[\s\S]*?\n\}/)?.[0],
        peelSource.match(/function mergeAdminLibraryState[\s\S]*?\n\}/)?.[0]
    ].filter(Boolean).join('\n\n');
    vm.runInContext(helpers, context);
    return context.mergeAdminLibraryState;
}

describe('admin library schema merge', () => {
    it('merges adminLibrary without clobbering custom formSchema on bootstrap', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const peelSource = readSource('assets/js/app/api-admin-merge-runtime.js');
        const stateSource = readSource('assets/js/app/state.js');
        const syncSource = readSource('assets/js/shared/library-catalog-sync.js');

        expect(peelSource).toContain('function mergeAdminLibraryState(localLibrary, remoteLibrary, options = {})');
        expect(peelSource).toContain('function isDefaultAdminLibraryFormSchema(schema)');
        expect(peelSource).toMatch(/mergeAdminLibraryState[\s\S]*localRevision > remoteRevision/);
        expect(peelSource).toContain('function getAdminLibraryFormSchemaFieldSignature(schema)');
        expect(peelSource).toContain('formSchemaRevision');
        expect(apiSource).toContain("if (key === 'adminLibrary')");
        expect(apiSource).toContain('mergeAdminLibraryState(local[key], remoteState[key], { preferLocal })');
        expect(apiSource).toContain('const mergeAdminLibraryState = window.mergeAdminLibraryState');
        expect(apiSource).not.toContain('function mergeAdminLibraryState(localLibrary, remoteLibrary, options = {})');
        expect(apiSource).toContain('window.renderAdminLibraryAfterBootstrap');
        expect(apiSource).toContain('window.__KIU_PORTAL_BOOTSTRAP_PENDING = false');
        expect(stateSource).toContain('window.__KIU_PORTAL_BOOTSTRAP_PENDING = true');
        expect(syncSource).toContain('global.ensureLibraryCatalogState');
        expect(syncSource).toContain('formSchemaCustomized');
    });

    it('prefers newer local schema revision even when remote has more fields', () => {
        const peelSource = readSource('assets/js/app/api-admin-merge-runtime.js');
        expect(peelSource).toMatch(/localRevision > remoteRevision[\s\S]*applyLocalSchemaMerge\(\)/);
        expect(peelSource).toMatch(/local\.formSchemaCustomized === true && localSignature !== remoteSignature[\s\S]*applyLocalSchemaMerge\(\)/);
    });

    it('merges books by id with revision/updatedAt preference and sections by id map', () => {
        const mergeAdminLibraryState = loadMergeAdminLibraryState();
        const merged = mergeAdminLibraryState({
            formSchema: [{ id: 'title' }],
            formSchemaRevision: 2,
            books: [
                { id: 'a', title: 'Local newer', revision: 3 },
                { id: 'b', title: 'Local only' },
                { id: 'c', title: 'Local older', updatedAt: '2024-01-01T00:00:00.000Z' }
            ],
            catalogSections: [
                { id: 'books', label: 'Books' },
                { id: 'journals', label: 'Journals local' }
            ],
            catalogPageSize: 50,
            catalogPageIndex: 2,
            droplistFilters: { genre: 'Poetry' }
        }, {
            formSchema: [{ id: 'title' }, { id: 'author' }],
            formSchemaRevision: 1,
            books: [
                { id: 'a', title: 'Remote older', revision: 1 },
                { id: 'c', title: 'Remote newer', updatedAt: '2025-01-01T00:00:00.000Z' },
                { id: 'd', title: 'Remote only' }
            ],
            catalogSections: [
                { id: 'books', label: 'Books remote' },
                { id: 'media', label: 'Media' }
            ],
            catalogPageSize: 10,
            droplistFilters: { genre: 'Remote' }
        }, { preferLocal: true });

        expect(merged.formSchema).toEqual([{ id: 'title' }]);
        expect(merged.books.find((book) => book.id === 'a').title).toBe('Local newer');
        expect(merged.books.find((book) => book.id === 'c').title).toBe('Remote newer');
        expect(merged.books.map((book) => book.id).sort()).toEqual(['a', 'b', 'c', 'd']);
        expect(merged.catalogSections.map((section) => section.id).sort()).toEqual(['books', 'journals', 'media']);
        expect(merged.catalogSections.find((section) => section.id === 'books').label).toBe('Books');
        expect(merged.catalogPageSize).toBe(50);
        expect(merged.catalogPageIndex).toBe(2);
        expect(merged.droplistFilters).toEqual({ genre: 'Poetry' });
    });
});
