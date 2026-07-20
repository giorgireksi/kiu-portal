import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource as readBareSource } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function loadBlueprintApi() {
    const context = {
        window: { KIU_STATE: {} },
        KIU_STATE: {},
        saveState: () => {}
    };
    context.window.KIU_STATE = context.KIU_STATE;
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
    return context.window;
}

describe('staff form blueprint system', () => {
    it('starts with empty professor and TA schemas', () => {
        const api = loadBlueprintApi();
        const blueprint = api.ensureStaffFormBlueprint();
        expect(blueprint.staffTypes.map((type) => type.id)).toEqual(['professor', 'ta']);
        expect(blueprint.schemas.professor).toEqual({ sections: [] });
        expect(blueprint.schemas.ta).toEqual({ sections: [] });
        expect(blueprint.version).toBe(2);
        expect(api.staffFormSchemaIsEmpty('professor')).toBe(true);
    });

    it('supports custom staff types and copy between schemas', () => {
        const api = loadBlueprintApi();
        api.addStaffFormSection('ta', 'input', { title: 'Basic', description: 'Identity' });
        const sectionId = api.getStaffFormSchema('ta').sections[0].id;
        api.addStaffFormField('ta', 'input', sectionId, {
            label: 'Full name',
            key: 'full_name',
            type: 'text',
            required: true
        });
        api.addStaffFormType('Dean', 'dean');
        const customType = api.getStaffFormTypes().find((type) => type.slug === 'dean');
        expect(customType).toBeTruthy();
        const copyResult = api.copyStaffFormBlueprint('ta', customType.id, { inputs: true, droplists: false });
        expect(copyResult.ok).toBe(true);
        const copied = api.getStaffFormSchema(customType.id);
        expect(copied.sections).toHaveLength(1);
        expect(copied.sections[0].fields[0].key).toBe('full_name');
    });

    

});