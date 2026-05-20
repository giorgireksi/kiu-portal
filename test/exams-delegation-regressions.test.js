import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('exams delegation regressions', () => {
    it('keeps the exams console and lazy companion modules on delegated actions and field handlers', () => {
        const baseSource = readSource('assets/js/pages/exams-console.js');
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');
        const adminSource = readSource('assets/js/pages/exams-console-admin.js');
        const attemptsSource = readSource('assets/js/pages/exams-console-attempts.js');
        const combined = `${baseSource}\n${builderSource}\n${adminSource}\n${attemptsSource}`;

        expect(baseSource).toContain('function invokeExamDelegate(fnName, rawArgs, target)');
        expect(baseSource).toContain('data-exam-call="setExamTab"');
        expect(baseSource).toContain('data-exam-change-call="${updateFunc}"');
        expect(builderSource).toContain('function setAutoGenVariantCount(value)');
        expect(builderSource).toContain('data-exam-call="saveAndSubmitExamTemplate"');
        expect(builderSource).toContain('data-exam-input-call="syncExamTemplateField"');
        expect(adminSource).toContain('function setExamSplitStudentCount(value)');
        expect(adminSource).toContain('data-exam-call="saveExamSchedule"');
        expect(adminSource).toContain('data-exam-change-call="updateExamScheduleField"');
        expect(attemptsSource).toContain('data-exam-call="runExamStudentAction"');
        expect(attemptsSource).toContain('data-exam-input-call="updateExamManualGradeDraft"');
        expect(combined).not.toContain('onclick=');
        expect(combined).not.toContain('onchange=');
        expect(combined).not.toContain('oninput=');
        expect(combined).not.toContain('ondragover=');
        expect(combined).not.toContain('ondrop=');
    });
});
