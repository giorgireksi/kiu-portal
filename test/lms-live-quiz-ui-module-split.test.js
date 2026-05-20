import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz UI module split', () => {
    it('moves LMS live quiz UI/render helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260518-lmsliveui1');
        expect(liveQuizUiSource).toContain('function getLmsLiveStudentId()');
        expect(liveQuizUiSource).toContain('function canManageLmsLiveQuiz(resourceKey = currentCourseId)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveScoreList(session = null, limit = 8)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveStaffWorkspace(context)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveStudentWorkspace(context)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveQuizSection(courseId)');
        expect(lmsSource).not.toContain('function getLmsLiveStudentId()');
        expect(lmsSource).not.toContain('function canManageLmsLiveQuiz(resourceKey = currentCourseId)');
        expect(lmsSource).not.toContain('function renderLmsLiveScoreList(session = null, limit = 8)');
        expect(lmsSource).not.toContain('function renderLmsLiveStaffWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsLiveStudentWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsLiveQuizSection(courseId)');
    });
});
