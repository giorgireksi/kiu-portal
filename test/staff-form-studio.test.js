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

function loadBuilderRuntime() {
    const context = {
        window: {},
        document: { getElementById: () => null }
    };
    context.window.window = context.window;
    context.__KIU_FORM_BUILDER_NS__ = 'staff';
    context.window.__KIU_FORM_BUILDER_NS__ = 'staff';
    // Actions peel must load before form-builder-runtime (throws if missing).
    vm.runInNewContext(readSource('assets/js/pages/form-builder-actions-runtime.js'), context);
    vm.runInNewContext(readSource('assets/js/pages/form-builder-runtime.js'), context);
    return context.window;
}

describe('staff form studio', () => {
    it('parses droplist options from one label per line', () => {
        const api = loadBuilderRuntime();
        expect(api.parseStaffFormOptionsFromLines('Active\nOn leave\nRetired')).toEqual([
            { value: 'active', label: 'Active' },
            { value: 'on_leave', label: 'On leave' },
            { value: 'retired', label: 'Retired' }
        ]);
        expect(api.parseStaffFormOptionsFromLines('Active\nActive\n')).toEqual([
            { value: 'active', label: 'Active' },
            { value: 'active_2', label: 'Active' }
        ]);
    });

    it('slugifies field keys for auto-key generation', () => {
        const api = loadBuilderRuntime();
        expect(api.slugifyStaffFormFieldKey('Full Name')).toBe('full_name');
        expect(api.slugifyStaffFormFieldKey('  ')).toBe('field');
    });

    

    

});