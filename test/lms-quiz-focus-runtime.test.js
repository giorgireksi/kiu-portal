import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms-quiz-focus-runtime peel', () => {
    it('owns student quiz focus helpers via factory', () => {
        const main = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const peel = readSource('assets/js/pages/lms-quiz-focus-runtime.js');
        expect(main).not.toMatch(/^\s*function enableLmsStudentQuizFocusMode\b/m);
        expect(main).not.toMatch(/^\s*function getLmsStudentQuizFocusState\b/m);
        expect(peel).toContain('function enableLmsStudentQuizFocusMode');
        expect(peel).toContain('function getLmsStudentQuizFocusState');
        expect(peel).toContain('__kiuCreateLmsQuizFocusApi');
        expect(peel).toContain('__KIU_LMS_QUIZ_FOCUS_LOADED');
        expect(peel).toContain('Object.assign(window, api)');
    });

    it('loads before quiz workspace in LMS_QUIZ_MODULE_URLS', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabs.indexOf('lms-quiz-focus-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-quiz-workspace-runtime.js'));
        expect(tabs.indexOf('lms-quiz-model.js'))
            .toBeLessThan(tabs.indexOf('lms-quiz-focus-runtime.js'));
    });
});
