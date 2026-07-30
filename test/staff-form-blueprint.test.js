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
    it('starts with empty professor, TA, and student service schemas', () => {
        const api = loadBlueprintApi();
        const blueprint = api.ensureStaffFormBlueprint();
        expect(blueprint.staffTypes.map((type) => type.id)).toEqual(['professor', 'ta', 'student_service']);
        expect(blueprint.schemas.professor).toEqual({ sections: [] });
        expect(blueprint.schemas.ta).toEqual({ sections: [] });
        expect(blueprint.schemas.student_service).toEqual({ sections: [] });
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

    it('strips HTML from field labels and section titles on write and normalize', () => {
        const api = loadBlueprintApi();
        api.addStaffFormSection('professor', 'input', {
            title: 'Profile<section>oops</section>',
            description: 'Notes<div>x</div>'
        });
        const sectionId = api.getStaffFormSchema('professor').sections[0].id;
        expect(api.getStaffFormSchema('professor').sections[0].title).toBe('Profile oops');
        api.addStaffFormField('professor', 'input', sectionId, {
            label: 'New field<section class="staff-hub-form-settings">bad</section>',
            type: 'text'
        });
        const fieldId = api.getStaffFormSchema('professor').sections[0].fields[0].id;
        expect(api.getStaffFormSchema('professor').sections[0].fields[0].label).toBe('New field bad');
        api.updateStaffFormField('professor', 'input', sectionId, fieldId, {
            label: '<strong>Email</strong>'
        });
        expect(api.getStaffFormSchema('professor').sections[0].fields[0].label).toBe('Email');
    });

    it('rejects page-dump text accidentally stored as field labels', () => {
        const api = loadBlueprintApi();
        api.addStaffFormSection('professor', 'input', { title: 'Profile' });
        const sectionId = api.getStaffFormSchema('professor').sections[0].id;
        api.addStaffFormField('professor', 'input', sectionId, {
            label: 'New field Admin workspace Staff form settings 2 staff types Design registration forms',
            type: 'text'
        });
        expect(api.getStaffFormSchema('professor').sections[0].fields[0].label).toBe('Untitled field');
    });

    it('persists showOnPersonalData on staff fields', () => {
        const api = loadBlueprintApi();
        api.addStaffFormSection('student_service', 'input', { title: 'Profile' });
        const sectionId = api.getStaffFormSchema('student_service').sections[0].id;
        api.addStaffFormField('student_service', 'input', sectionId, {
            label: 'Office',
            key: 'office',
            type: 'text'
        });
        const field = api.getStaffFormSchema('student_service').sections[0].fields[0];
        expect(field.showOnPersonalData).toBe(false);
        const result = api.updateStaffFormField('student_service', 'input', sectionId, field.id, {
            showOnPersonalData: true
        });
        expect(result?.error).toBeFalsy();
        const updated = api.getStaffFormSchema('student_service').sections[0].fields[0];
        expect(updated.showOnPersonalData).toBe(true);
    });

});