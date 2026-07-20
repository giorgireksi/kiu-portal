import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms-quiz-blue-runtime peel', () => {
    it('owns Kiu Blue helper/gate/heartbeat outside lms.js', () => {
        const lms = readSource('assets/js/pages/lms.js');
        const blue = readSource('assets/js/pages/lms-quiz-blue-runtime.js');
        expect(lms).toContain('lms-quiz-blue-runtime.js');
        expect(lms).not.toMatch(/^function getKiuBlueHelperBaseUrl\b/m);
        expect(lms).not.toMatch(/^function ensureKiuBlueStudentHeartbeat\b/m);
        expect(lms).not.toMatch(/^function getLmsQuizBlueGateStatus\b/m);
        expect(blue).toContain('function getKiuBlueHelperBaseUrl');
        expect(blue).toContain('function ensureKiuBlueStudentHeartbeat');
        expect(blue).toContain('function getLmsQuizBlueGateStatus');
        expect(blue).toContain('window.ensureKiuBlueStudentHeartbeat');
        expect(blue).toContain('__KIU_LMS_QUIZ_BLUE_LOADED');
    });

    it('loads eagerly before lms.js and before quiz workspace in LMS_QUIZ_MODULE_URLS', () => {
        const html = readSource('lms.html');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(html).toContain('lms-quiz-blue-runtime.js');
        expect(html.indexOf('lms-quiz-blue-runtime.js')).toBeLessThan(html.indexOf('assets/js/pages/lms.js'));
        expect(tabs).toContain('lms-quiz-blue-runtime.js');
        expect(tabs.indexOf('lms-quiz-model.js')).toBeLessThan(tabs.indexOf('lms-quiz-blue-runtime.js'));
        expect(tabs.indexOf('lms-quiz-blue-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-quiz-workspace-runtime.js'));
    });
});
