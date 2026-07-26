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
    Object.assign(context, context.window);
    context.ensureStaffFormBlueprint();
    return context;
}

function loadBuilderRuntime() {
    const context = {
        window: { KIU_STATE: {} },
        KIU_STATE: {},
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

describe('staff form blueprint save UX', () => {
    it('keeps blueprint save bar wired and form settings on shared bare-lite layout', () => {
        const staffHtml = readSource('staff.html');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');
        const builderJs = readSource('assets/js/pages/form-builder-runtime.js');
        const css = readBareSource('assets/css/lux-page-bare-lite.css');
        const profileRowFn = builderJs.match(/function renderProfileNameRow[\s\S]*?^    }/m)?.[0] ?? '';
        expect(profileRowFn).toContain('remove-section');
        expect(builderJs).toContain('${H.hub}-profile-add');
        expect(builderJs).toContain('${H.hub}-form-settings ${H.entity}-admin-workspace">');
        expect(builderJs).not.toContain('form-settings ${H.entity}-admin-workspace" data-lux-glass-root="1"');
        expect(handleBuilderInputSkipsRefresh(builderJs)).toBe(true);
        expect(staffJs).toContain('builderDirty: false');
        expect(staffJs).toContain('builderLastSavedAt: null');
        expect(css).toContain('.staff-hub-studio-save-bar');
        expect(css).toContain('.staff-hub-studio-save-status.is-dirty');
        expect(css).toContain('.staff-hub-studio-save-status.is-clean');
        const fouc = readBareSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.staff-hub-form-settings-head');
        expect(fouc).toContain('.staff-hub-builder-rail');
        expect(fouc).toContain('var(--lux-panel-fill)');
        expect(staffHtml).toContain('staff-form-builder-runtime.js');
        expect(readSource('assets/js/pages/staff-command-center.js')).toContain('ensureFormBuilderRuntime');
        expect(readSource('assets/js/pages/staff-command-center.js')).toContain('form-builder-runtime.js?v=');
        expect(staffHtml).not.toContain('staff-command-center.css');
        expectRetiredCss('staff-command-center.css');
    });

    it('assigns unique keys when quick-adding fields with the same label', () => {
        const api = loadBlueprintApi();
        const section = api.addStaffFormSection('professor', 'input', { title: 'Profile' });
        const first = api.addStaffFormField('professor', 'input', section.id, { label: 'Short text', type: 'text' });
        const second = api.addStaffFormField('professor', 'input', section.id, { label: 'Short text', type: 'text' });

        expect(first.key).toBe('short_text');
        expect(second.key).toBe('short_text_2');
        expect(second.error).toBeUndefined();
    });
});

function handleBuilderInputSkipsRefresh(source) {
    const fnStart = source.indexOf('function handleBuilderInput(');
    const fnBody = source.slice(fnStart, fnStart + 2600);
    const inputSection = fnBody.slice(0, fnBody.indexOf('if (!data.sectionId || !data.fieldId'));
    return !inputSection.includes('onRefresh?.()');
}