import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadStaffDirectoryFiltersApi() {
    const context = {
        KIU_STATE: {},
        saveState: () => {}
    };
    context.window = context;
    context.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
    if (context.window) context.window.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
        // Minimal shared escapeHtml (avoid loading full utilities.js which needs document).
    context.escapeHtml = function escapeHtml(value) {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    context.window.escapeHtml = context.escapeHtml;
    vm.runInNewContext(readSource('assets/js/pages/form-blueprint-runtime.js'), context);
    context.__KIU_DIRECTORY_FILTERS_NS__ = 'staff';
    context.window.__KIU_DIRECTORY_FILTERS_NS__ = 'staff';
    vm.runInNewContext(readSource('assets/js/pages/directory-filters-runtime.js'), context);
    return context;
}

function seedMergedDirectoryFilterBlueprint(api, records = []) {
    const professorSection = api.addStaffFormSection('professor', 'droplist', { title: 'Directory' });
    api.addStaffFormField('professor', 'droplist', professorSection.id, {
        label: 'Display role',
        key: 'display_role',
        options: [
            { value: 'Professor', label: 'Professor' },
            { value: 'Chair', label: 'Department Chair' }
        ]
    });

    const taSection = api.addStaffFormSection('ta', 'droplist', { title: 'Directory' });
    api.addStaffFormField('ta', 'droplist', taSection.id, {
        label: 'Display role',
        key: 'display_role',
        options: [
            { value: 'TA', label: 'Teaching Assistant' }
        ]
    });

    return api.buildStaffDirectoryFilterModel(records);
}

describe('staff directory filters runtime', () => {
    it('buildStaffDirectoryFilterModel merges the same key across staff types', () => {
        const api = loadStaffDirectoryFiltersApi();
        const model = seedMergedDirectoryFilterBlueprint(api);

        expect(model.blueprintFilters).toHaveLength(1);
        expect(model.blueprintFilters[0]).toMatchObject({
            key: 'display_role',
            label: 'Display role',
            staffTypeIds: ['professor', 'ta'],
            source: 'records',
            dynamic: true
        });
        expect(model.blueprintFilters[0].options).toEqual([]);

        const withRecords = seedMergedDirectoryFilterBlueprint(api, [
            { id: '1', fieldValues: { display_role: 'Professor' } },
            { id: '2', fieldValues: { display_role: 'TA' } },
            { id: '3', fieldValues: { display_role: 'Chair' } }
        ]);
        expect(withRecords.blueprintFilters[0].options.map((option) => option.value)).toEqual([
            'Chair',
            'Professor',
            'TA'
        ]);
    });

    it('includes fields from all sections regardless of filterGroup and showInDirectoryFilter', () => {
        const api = loadStaffDirectoryFiltersApi();
        const section = api.addStaffFormSection('professor', 'input', { title: 'Identity', filterGroup: false });
        api.addStaffFormField('professor', 'input', section.id, {
            label: 'Display role',
            key: 'display_role',
            options: [{ value: 'Professor', label: 'Professor' }]
        });
        api.addStaffFormField('professor', 'droplist', section.id, {
            label: 'Internal status',
            key: 'internal_status',
            showInDirectoryFilter: false,
            options: [{ value: 'Hidden', label: 'Hidden' }]
        });

        const model = api.buildStaffDirectoryFilterModel();

        expect(model.blueprintFilters.map((filter) => filter.key).sort()).toEqual(['display_role', 'internal_status']);
    });

    it('getStaffRecordFieldValue prefers fieldValues and falls back to legacy aliases', () => {
        const api = loadStaffDirectoryFiltersApi();

        expect(api.getStaffRecordFieldValue({
            fieldValues: { staff_status: 'Active' }
        }, 'staff_status')).toBe('Active');

        expect(api.getStaffRecordFieldValue({
            status: 'Pending'
        }, 'staff_status')).toBe('Pending');
    });

    it('applyStaffDirectoryFilters filters records by blueprint field values', () => {
        const api = loadStaffDirectoryFiltersApi();
        const records = [
            { id: '1', name: 'Ada', fieldValues: { display_role: 'Professor' }, status: 'Active' },
            { id: '2', name: 'Ben', fieldValues: { display_role: 'TA' }, status: 'Active' }
        ];
        const model = seedMergedDirectoryFilterBlueprint(api, records);

        const filtered = api.applyStaffDirectoryFilters(
            records,
            { field: { display_role: 'Professor' } },
            model
        );

        expect(filtered.map((record) => record.id)).toEqual(['1']);
    });

    it('normalizeStaffDirectoryFilters migrates legacy role to field.display_role', () => {
        const api = loadStaffDirectoryFiltersApi();
        const model = seedMergedDirectoryFilterBlueprint(api, [
            { id: '1', fieldValues: { display_role: 'Professor' } }
        ]);

        const normalized = api.normalizeStaffDirectoryFilters({ role: 'Professor' }, model);

        expect(normalized.field.display_role).toBe('Professor');
        expect(normalized.role).toBeUndefined();
    });

    it('buildStaffDirectoryFilterChips renders active blueprint field filters', () => {
        const api = loadStaffDirectoryFiltersApi();
        const model = seedMergedDirectoryFilterBlueprint(api, [
            { id: '1', fieldValues: { display_role: 'Professor' } }
        ]);

        const chips = api.buildStaffDirectoryFilterChips(
            { field: { display_role: 'Professor' } },
            model
        );

        expect(chips).toContainEqual(['Display role', 'Professor', 'display_role', 'field']);
    });

    

    

    it('collapses filters with the same label but different keys', () => {
        const api = loadStaffDirectoryFiltersApi();
        const professorSection = api.addStaffFormSection('professor', 'droplist', { title: 'Directory' });
        api.addStaffFormField('professor', 'droplist', professorSection.id, {
            label: 'Department',
            key: 'department',
            type: 'text'
        });
        const taSection = api.addStaffFormSection('ta', 'droplist', { title: 'Directory' });
        api.addStaffFormField('ta', 'droplist', taSection.id, {
            label: 'Department',
            key: 'dept',
            type: 'text'
        });

        const records = [
            { id: '1', fieldValues: { department: 'Business Management' } },
            { id: '2', fieldValues: { dept: 'Law' } }
        ];
        const model = api.buildStaffDirectoryFilterModel(records);

        expect(model.blueprintFilters).toHaveLength(1);
        expect(model.blueprintFilters[0].key).toBe('department');
        expect(model.blueprintFilters[0].aliasKeys).toContain('dept');
        expect(model.blueprintFilters[0].options.map((option) => option.value)).toEqual([
            'Business Management',
            'Law'
        ]);
    });

    it('includes text fields from non-filterGroup sections', () => {
        const api = loadStaffDirectoryFiltersApi();
        const section = api.addStaffFormSection('professor', 'input', { title: 'Office', filterGroup: false });
        api.addStaffFormField('professor', 'input', section.id, {
            label: 'Office',
            key: 'office',
            type: 'text'
        });

        const model = api.buildStaffDirectoryFilterModel([
            { id: '1', fieldValues: { office: 'Room 12' } }
        ]);

        expect(model.blueprintFilters.map((filter) => filter.key)).toEqual(['office']);
        expect(model.blueprintFilters[0].dynamic).toBe(true);
        expect(model.blueprintFilters[0].options).toEqual([{ value: 'Room 12', label: 'Room 12' }]);
    });

    it('applyStaffDirectoryFilters supports droplistQuery and alias keys', () => {
        const api = loadStaffDirectoryFiltersApi();
        const professorSection = api.addStaffFormSection('professor', 'droplist', { title: 'Directory' });
        api.addStaffFormField('professor', 'droplist', professorSection.id, {
            label: 'Department',
            key: 'department',
            type: 'text'
        });
        const taSection = api.addStaffFormSection('ta', 'droplist', { title: 'Directory' });
        api.addStaffFormField('ta', 'droplist', taSection.id, {
            label: 'Department',
            key: 'dept',
            type: 'text'
        });

        const records = [
            { id: '1', fieldValues: { department: 'Business Management' }, status: 'Active' },
            { id: '2', fieldValues: { dept: 'Law' }, status: 'Active' }
        ];
        const model = api.buildStaffDirectoryFilterModel(records);

        const byAliasValue = api.applyStaffDirectoryFilters(
            records,
            { field: { department: 'Law' } },
            model
        );
        expect(byAliasValue.map((record) => record.id)).toEqual(['2']);

        const byDroplistQuery = api.applyStaffDirectoryFilters(
            records,
            { droplistQuery: 'business' },
            model
        );
        expect(byDroplistQuery.map((record) => record.id)).toEqual(['1']);
    });

    it('buildStaffDirectoryFilterChips renders droplist search chip', () => {
        const api = loadStaffDirectoryFiltersApi();
        const model = seedMergedDirectoryFilterBlueprint(api, [
            { id: '1', fieldValues: { display_role: 'Chair' } }
        ]);
        const chips = api.buildStaffDirectoryFilterChips({ droplistQuery: 'Chair' }, model);
        expect(chips).toContainEqual(['Droplist search', 'Chair', 'droplistQuery', 'system']);
    });

    

    it('buildStaffDirectoryFilterModel stays empty when blueprint has no filter fields', () => {
        const api = loadStaffDirectoryFiltersApi();
        const records = [
            { id: '1', department: 'Business Management', role: 'Professor', status: 'Active', accountStatus: 'Account Active' },
            { id: '2', department: 'Law', role: 'Teaching Assistant', status: 'Pending Setup', accountStatus: 'Needs Review' }
        ];

        const model = api.buildStaffDirectoryFilterModel(records);

        expect(model.usingRecordFallback).toBe(false);
        expect(model.blueprintFilters).toEqual([]);
    });

    

    

});