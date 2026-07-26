import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
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
    vm.runInNewContext(readSource('assets/js/pages/form-builder-actions-runtime.js'), context);
    Object.assign(context, context.window);
    vm.runInNewContext(readSource('assets/js/pages/form-builder-runtime.js'), context);
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

describe('staff profile panel', () => {
    it('creates blank profiles without auto title or starter field', () => {
        const api = loadBuilderApi();
        const section = api.addSectionFromTemplate('professor', 'blank', '');
        expect(section.title).toBe('');
        expect(section.fields || []).toHaveLength(0);
    });

    

    

    

    

});