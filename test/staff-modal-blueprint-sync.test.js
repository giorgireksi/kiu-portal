import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadBlueprintAndRenderer() {
    const context = {
        window: { KIU_STATE: {} },
        KIU_STATE: {},
        document: {
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => []
        },
        saveState: () => {}
    };
    context.window.KIU_STATE = context.KIU_STATE;
    context.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
    if (context.window) context.window.__KIU_FORM_BLUEPRINT_NS__ = 'staff';
    vm.runInNewContext(readSource('assets/js/pages/form-blueprint-runtime.js'), context);
    Object.assign(context, context.window);
    context.__KIU_FORM_RENDERER_NS__ = 'staff';
    context.__KIU_FORM_BUILDER_NS__ = 'staff';
    if (context.window) {
        context.window.__KIU_FORM_RENDERER_NS__ = 'staff';
        context.window.__KIU_FORM_BUILDER_NS__ = 'staff';
    }
    vm.runInNewContext(readSource('assets/js/pages/form-renderer-runtime.js'), context);
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

describe('staff modal blueprint sync', () => {
    

    it('treats section shells without fields as empty schema', () => {
        const api = loadBlueprintAndRenderer();
        api.addStaffFormSection('professor', 'input', { title: 'Empty shell' });
        api.addStaffFormSection('professor', 'droplist', { title: 'Empty picklist shell' });

        expect(api.staffFormSchemaIsEmpty('professor')).toBe(true);
        const html = api.renderStaffFormFromBlueprint('professor', { fieldValues: {} });
        expect(html).toContain('Steps configured, but no fields yet');
    });

    

});