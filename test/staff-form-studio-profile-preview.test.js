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

function loadStudioApi() {
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
    context.__KIU_FORM_RENDERER_NS__ = 'staff';
    context.__KIU_FORM_BUILDER_NS__ = 'staff';
    if (context.window) {
        context.window.__KIU_FORM_RENDERER_NS__ = 'staff';
        context.window.__KIU_FORM_BUILDER_NS__ = 'staff';
    }
    vm.runInNewContext(readSource('assets/js/pages/form-renderer-runtime.js'), context);
    Object.assign(context, context.window);
    context.__KIU_FORM_BUILDER_NS__ = 'staff';
    if (context.window) context.window.__KIU_FORM_BUILDER_NS__ = 'staff';
    vm.runInNewContext(readSource('assets/js/pages/form-builder-runtime.js'), context);
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

describe('staff form studio profile preview', () => {
    it('renders only the active profile in blueprint preview mode', () => {
        const api = loadStudioApi();
        const sectionA = api.addStaffFormSection('professor', { title: 'test 1' });
        const sectionB = api.addStaffFormSection('professor', { title: 'test 2' });
        api.addStaffFormField('professor', null, sectionA.id, { label: 'Field A', type: 'text' });
        api.addStaffFormField('professor', null, sectionB.id, { label: 'Field B', type: 'text' });

        const html = api.renderStaffFormFromBlueprint('professor', {}, {
            previewMode: true,
            activeSectionId: sectionB.id
        });

        expect(html).toContain('test 2');
        expect(html).toContain('Field B');
        expect(html).not.toContain('test 1');
        expect(html).not.toContain('Field A');
    });

    

    

});