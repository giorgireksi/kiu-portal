import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { socialModuleUrlToken } from './helpers/social-page-source.js';

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
        expect(page).toContain(socialModuleUrlToken('social-surveys.js'));
    });

    it('uses scroll rails for survey card descriptions', () => {
        const surveys = readFileSync(join(process.cwd(), 'assets/js/pages/social-surveys.js'), 'utf8');
        const bare = readFileSync(join(process.cwd(), 'assets/css/lux-page-bare-lite.css'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const interactions = readFileSync(join(process.cwd(), 'assets/js/pages/social-page-interactions-runtime.js'), 'utf8');
        const shellRuntime = readFileSync(join(process.cwd(), 'assets/js/pages/social-page-shell-runtime.js'), 'utf8');
        const renderCardStart = surveys.indexOf('function renderSurveyCard(survey)');
        const renderCardEnd = surveys.indexOf('function surveyDraftReadyQuestionCount', renderCardStart);
        const renderCardBlock = surveys.slice(renderCardStart, renderCardEnd > 0 ? renderCardEnd : undefined);
        const railHelperChunk = surveys.slice(
            surveys.indexOf('const renderSurveyCardDescRail ='),
            surveys.indexOf('function renderSurveyCard(survey)', surveys.indexOf('const renderSurveyCardDescRail ='))
        );

        expect(surveys).toContain('const renderSurveyCardDescRail =');
        expect(railHelperChunk).toContain('data-survey-desc-rail');
        expect(railHelperChunk).toContain('lux-scroll-rail__dock--vertical');
        expect(railHelperChunk).toContain('hidden aria-hidden="true"');
        expect(renderCardBlock).toContain('renderSurveyCardDescRail(text(survey.id), text(survey.description))');
        expect(renderCardBlock).not.toMatch(/<div class="social-neo-muted social-neo-survey-card-desc">\$\{escape\(text\(survey\.description\)\)\}<\/div>/);
        expect(bare).toMatch(/\.social-neo-survey-card-desc-viewport\s*\{[\s\S]{0,300}max-height:\s*calc\(1\.45em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-survey-card-desc-rail\.is-scrollable[\s\S]{0,400}min-height:\s*calc\(1\.45em \* 6 \+ 16px \+ 12px\)/);
        expect(page).toContain(socialModuleUrlToken('social-surveys.js'));
        expect(shellRuntime).toContain('[data-survey-desc-rail]');
        expect(interactions).toMatch(/activePanel === 'surveys'[\s\S]{0,200}syncEventDescScrollRails/);
    });
});
