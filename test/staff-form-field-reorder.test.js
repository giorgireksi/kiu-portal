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
    vm.runInNewContext(readSource('assets/js/pages/form-blueprint-runtime.js'), context);
    return context.window;
}

function loadBuilderApi() {
    const context = {
        window: { KIU_STATE: {} },
        KIU_STATE: {},
        document: { getElementById: () => null },
        saveState: () => {}
    };
    context.window.KIU_STATE = context.KIU_STATE;
    context.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
    if (context.window) context.window.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
    vm.runInNewContext(readSource('assets/js/pages/form-blueprint-runtime.js'), context);
    Object.assign(context, context.window);
    context.__KIU_FORM_BUILDER_NS__ = 'staff';
    if (context.window) context.window.__KIU_FORM_BUILDER_NS__ = 'staff';
    vm.runInNewContext(readSource('assets/js/pages/form-builder-runtime.js'), context);
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

describe('staff form field reorder', () => {
    it('reorders fields by splicing to an arbitrary index', () => {
        const api = loadBlueprintApi();
        const section = api.addStaffFormSection('professor', { title: 'Profile' });
        const fieldA = api.addStaffFormField('professor', null, section.id, { label: 'A', type: 'text' });
        const fieldB = api.addStaffFormField('professor', null, section.id, { label: 'B', type: 'text' });
        const fieldC = api.addStaffFormField('professor', null, section.id, { label: 'C', type: 'text' });

        const result = api.reorderStaffFormField('professor', section.id, fieldC.id, 0);
        expect(result.ok).toBe(true);

        const labels = api.getStaffFormSchema('professor').sections[0].fields
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((field) => field.label);
        expect(labels).toEqual(['C', 'A', 'B']);
        expect(api.getStaffFormSchema('professor').sections[0].fields.map((field) => field.id)).toEqual([
            fieldC.id,
            fieldA.id,
            fieldB.id
        ]);
    });

    

    

});