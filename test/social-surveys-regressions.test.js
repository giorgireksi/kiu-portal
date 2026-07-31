import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('social-surveys-regressions (bare-shell era)', () => {
    it('social domain paint CSS removed; behavior tests deferred to JS modules', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/social-projects-lms.css'))).toBe(false);
    });

    it('opens take survey UI when surveyTakingId is set', () => {
        const surveys = readFileSync(join(process.cwd(), 'assets/js/pages/social-surveys.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(surveys).toContain('function renderTakeSurvey(survey)');
        expect(surveys).toContain("text(runtime.ui?.surveyTakingId || '')");
        expect(surveys).toContain('return renderTakeSurvey(survey)');
        expect(surveys).toContain("data-action=\"survey-take-open\"");
        expect(page).toContain('social-surveys.js?v=20260731-surveytake1');
    });
});
