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

describe('staff form profile reorder', () => {
    it('reorders profiles by splicing to an arbitrary index', () => {
        const api = loadBlueprintApi();
        const alpha = api.addStaffFormSection('professor', { title: 'Alpha' });
        const beta = api.addStaffFormSection('professor', { title: 'Beta' });
        const gamma = api.addStaffFormSection('professor', { title: 'Gamma' });

        const result = api.reorderStaffFormSection('professor', gamma.id, 0);
        expect(result.ok).toBe(true);

        const titles = api.getStaffFormSchema('professor').sections
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((section) => section.title);
        expect(titles).toEqual(['Gamma', 'Alpha', 'Beta']);
        expect(api.getStaffFormSchema('professor').sections.map((section) => section.id)).toEqual([
            gamma.id,
            alpha.id,
            beta.id
        ]);
    });

    

    

});