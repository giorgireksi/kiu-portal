import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadBlueprint() {
    const source = readFileSync(join(process.cwd(), 'assets/js/pages/form-blueprint-runtime.js'), 'utf8');
    const context = {
        window: { __KIU_FORM_BLUEPRINT_NS__: 'student' },
        KIU_STATE: {},
        console
    };
    context.__KIU_FORM_BLUEPRINT_NS__ = 'student';
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
    vm.runInNewContext(source, context);
    return context.window;
}

describe('student form blueprint runtime', () => {
    it('loads without reference errors and exposes single student schema', () => {
        const api = loadBlueprint();
        expect(api.STUDENT_TYPE_ID).toBe('student');
        expect(api.MOBILITY_CATEGORIES).toHaveLength(4);
        api.ensureStudentFormBlueprint();
        const schema = api.getStudentFormSchema('student');
        expect(schema.sections.length).toBeGreaterThan(0);
        expect(api.addStudentFormType('X')).toEqual({ error: 'Student form uses a single unified schema.' });
    });
});
