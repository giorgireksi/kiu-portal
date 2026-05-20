import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS classroom tabs module split', () => {
    it('moves LMS classroom tabs and tab coordinator ownership out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260518-lmsclassroom1');

        expect(classroomSource).toContain('function openLMSGroups(subjectId, titleString, iconClass)');
        expect(classroomSource).toContain('function renderLmsBulkGroupTools(subjectId, subjectTitle, groups = [])');
        expect(classroomSource).toContain('function renderLmsSessionsSection(courseId = currentCourseId)');
        expect(classroomSource).toContain('function renderLmsMembersSection(courseId)');
        expect(classroomSource).toContain('function renderLmsInteractionSection(courseId = currentCourseId)');
        expect(classroomSource).toContain('function renderLmsAttendanceSection(courseId = currentCourseId)');
        expect(classroomSource).toContain('function getLmsSectionEnhancementContext(tab, courseId = currentCourseId)');
        expect(classroomSource).toContain('function switchLMSTab(tab)');

        expect(lmsSource).not.toContain('function openLMSGroups(subjectId, titleString, iconClass)');
        expect(lmsSource).not.toContain('function renderLmsBulkGroupTools(subjectId, subjectTitle, groups = [])');
        expect(lmsSource).not.toContain('function renderLmsSessionsSection(courseId = currentCourseId)');
        expect(lmsSource).not.toContain('function renderLmsMembersSection(courseId)');
        expect(lmsSource).not.toContain('function renderLmsInteractionSection(courseId = currentCourseId)');
        expect(lmsSource).not.toContain('function renderLmsAttendanceSection(courseId = currentCourseId)');
        expect(lmsSource).not.toContain('function getLmsSectionEnhancementContext(tab, courseId = currentCourseId)');
        expect(lmsSource).not.toContain('function switchLMSTab(tab)');
    });
});
