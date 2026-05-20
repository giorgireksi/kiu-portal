import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS assignments module split', () => {
    it('moves LMS assignment workspace rendering and submission helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const assignmentsSource = readSource('assets/js/pages/lms-assignments-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-assignments-runtime.js?v=20260518-lmsassignments1');
        expect(assignmentsSource).toContain('function renderWorkspace(courseId)');
        expect(assignmentsSource).toContain('async function createAssignment(courseId)');
        expect(assignmentsSource).toContain('async function submitAssignment(courseId, assignmentId)');
        expect(assignmentsSource).toContain('function deleteAssignment(courseId, assignmentId)');
        expect(assignmentsSource).toContain('function gradeLmsAssignmentSubmission(courseId, assignmentId, studentId)');
        expect(lmsSource).not.toContain('function renderWorkspace(courseId)');
        expect(lmsSource).not.toContain('async function createAssignment(courseId)');
        expect(lmsSource).not.toContain('async function submitAssignment(courseId, assignmentId)');
        expect(lmsSource).not.toContain('function deleteAssignment(courseId, assignmentId)');
        expect(lmsSource).not.toContain('function gradeLmsAssignmentSubmission(courseId, assignmentId, studentId)');
    });
});
