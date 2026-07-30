import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('registration legacy delegation regressions', () => {
    it('keeps the converted chancellery, program, provisioning, and subject-picking surfaces on delegated hooks', () => {
        const source = readSource('assets/js/pages/registration.js');

        expect(source).toContain('function bindRegistrationLegacyDelegates()');
        expect(source).toContain('data-reg-chanc-select-case');
        expect(source).not.toContain('data-reg-chanc-filter');
        expect(source).toContain('data-reg-chanc-status-target');
        expect(source).toContain('data-reg-chanc-tab');
        expect(source).toContain('data-subject-condition-select="1"');
        expect(source).toContain('data-condition-action="remove"');
        expect(source).toContain('data-antireq-action="toggle"');
        expect(source).toContain('data-antireq-action="clear"');
        expect(source).toContain('data-student-program-semester-filter');
        expect(source).toContain('data-student-program-search');
        expect(source).toContain('data-student-program-clear-search');
        expect(source).toContain('data-student-program-module-select');
        expect(source).toContain("action === 'add-subject'");
        expect(source).toContain("action === 'remove-subject'");
        expect(source).toContain("action === 'open-profile'");
        expect(source).toContain("action === 'open-student-registration'");
        expect(source).toContain("action === 'open-prof-registration'");
        expect(source).toContain("action === 'add-row'");
        expect(source).toContain("action === 'save'");
        expect(source).toContain("action === 'delete'");
        expect(source).toContain('data-edit-staff-sync-row="1"');
        expect(source).toContain("if (action === 'toggle') {");
        expect(source).toContain("if (action === 'add') {");
        expect(source).toContain("if (action === 'remove') {");
        expect(source).toContain("if (action === 'book') return bookOfficeHour");
        expect(source).toContain("if (action === 'upload') {");
        expect(source).toContain("if (action === 'select') {");
        expect(source).toContain("if (action === 'unselect') {");
        expect(source).not.toContain(`onclick="submitRequest()`);
        expect(source).not.toContain(`onclick="switchChancelleryTab('appeals')`);
        expect(source).not.toContain(`onmousedown="selectCondition(`);
        expect(source).not.toContain(`onclick="addSubjectTag(`);
        expect(source).not.toContain(`onclick="openStudentRegistration()`);
        expect(source).not.toContain(`onclick="openProfRegistration(`);
        expect(source).not.toContain(`onclick="toggleStuRegSubject(`);
        expect(source).not.toContain(`onclick="toggleProfRegSubject(`);
        expect(source).not.toContain(`onclick="bookOfficeHour(`);
        expect(source).not.toContain(`onclick="uploadToModule(`);
        expect(source).not.toContain(`onclick="selectCourseGroup(`);
        expect(source).not.toContain(`onclick="unselectCourseGroup(`);
    });
});
