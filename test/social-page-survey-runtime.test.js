import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-survey-runtime peel', () => {
    it('owns survey helpers outside social-page.js via factory', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const survey = readSource('assets/js/pages/social-page-survey-runtime.js');
        expect(page).toContain('__kiuCreateSocialPageSurveyApi');
        expect(page).not.toMatch(/^function patchSurveyCreateQuestionsPanel\b/m);
        expect(page).not.toMatch(/^function isSurveyAnswerProvided\b/m);
        expect(survey).toContain('function patchSurveyCreateQuestionsPanel');
        expect(survey).toContain('function isSurveyAnswerProvided');
        expect(survey).toContain('__kiuCreateSocialPageSurveyApi');
        expect(survey).toContain('__KIU_SOCIAL_PAGE_SURVEY_LOADED');
    });

    it('loads before social-page.js on social.html', () => {
        const html = readSource('social.html');
        expect(html).toContain('social-page-survey-runtime.js');
        expect(html.indexOf('social-page-survey-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
    });
});
