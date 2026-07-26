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
    vm.runInNewContext(readSource('assets/js/pages/form-builder-actions-runtime.js'), context);
    Object.assign(context, context.window);
    vm.runInNewContext(readSource('assets/js/pages/form-builder-runtime.js'), context);
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

describe('staff form droplist options', () => {
    

    it('persists parsed options and refreshes preview after save', () => {
        const api = loadBuilderApi();
        const section = api.addStaffFormSection('professor', 'input', { title: 'Status' });
        const field = api.addStaffFormField('professor', 'droplist', section.id, {
            label: 'drop',
            type: 'select',
            options: [{ value: 'option_1', label: 'Option 1' }]
        });

        let refreshCount = 0;
        const callbacks = {
            getState: () => ({}),
            setState: () => {},
            onToast: () => {},
            onRefresh: () => { refreshCount += 1; }
        };

        const el = {
            dataset: {
                staffBuilderInput: 'droplist-options-lines',
                staffTypeId: 'professor',
                staffBucket: 'droplist',
                staffSectionId: section.id,
                staffFieldId: field.id
            },
            value: 'Active\nOn leave\nRetired'
        };

        const builderJs = readSource('assets/js/pages/form-builder-runtime.js');
        expect(builderJs).toContain('saveDroplistOptionsLines');
        expect(builderJs).toContain('scheduleDroplistOptionsSave');
        expect(builderJs).toContain('flushFocusedDroplistOptions');
        expect(builderJs).toMatch(/saveDroplistOptionsLines\(el, callbacks, \{ refresh: true \}\)/);

        const parsed = api.parseStaffFormOptionsFromLines(el.value);
        api.updateStaffFormField('professor', 'droplist', section.id, field.id, { options: parsed });
        callbacks.onRefresh();

        const previewHtml = api.renderStaffFormFromBlueprint('professor', {}, {
            previewMode: true,
            activeSectionId: section.id
        });

        expect(parsed).toEqual([
            { value: 'active', label: 'Active' },
            { value: 'on_leave', label: 'On leave' },
            { value: 'retired', label: 'Retired' }
        ]);
        expect(previewHtml).toContain('value="active"');
        expect(previewHtml).toContain('value="on_leave"');
        expect(previewHtml).toContain('value="retired"');
        expect(refreshCount).toBe(1);
    });

    

});