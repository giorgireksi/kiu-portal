import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-survey-results-dialog (shared shell CSS)', () => {
    it('survey results dialog wires shared chip and typography classes', () => {
        const surveys = readSource('assets/js/pages/social-surveys.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(surveys).toContain('function renderSurveyResultsDialog');
        expect(surveys).toContain('lux-glass-dialog-card--survey-results');
        expect(surveys).toContain('lux-section-kicker');
        expect(surveys).toContain('lux-card-title');
        expect(surveys).toContain('lux-card-copy');
        expect(surveys).toContain('social-neo-surveys-hero home-hover-chip');
        expect(surveys).toContain('social-neo-surveys-hero-stats home-hover-chip');
        expect(surveys).toContain('social-neo-surveys-hero-grid social-neo-surveys-hero-grid--lanes home-hover-chip');
        expect(surveys).toContain('social-neo-surveys-hero-grid home-hover-chip');
        expect(surveys).toContain('social-neo-surveys-hero-toolbar home-hover-chip');
        expect(surveys).toContain('social-neo-survey-card home-hover-chip');
        expect(surveys).not.toMatch(/social-neo-surveys-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(surveys).toContain('social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
        expect(surveys).toContain('social-neo-survey-results-question lux-soft-chrome home-hover-chip');
        expect(surveys).toContain('social-neo-survey-result-row home-hover-chip');
        expect(surveys).toContain('social-neo-survey-results-type-pill home-hover-chip');
        expect(surveys).toContain('lux-primary-btn lux-glass-dialog-submit-btn home-hover-chip');
        expect(fouc).toContain('.social-neo-surveys-hero');
        expect(fouc).toContain('.social-neo-surveys-hero-stats');
        expect(fouc).toContain('.social-neo-surveys-hero-grid');
        expect(fouc).toContain('.social-neo-survey-card');
    });

    it('survey take view wires shared chip and typography classes', () => {
        const surveys = readSource('assets/js/pages/social-surveys.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(surveys).toContain('function renderTakeSurvey(survey)');
        expect(surveys).toContain('social-neo-survey-take-hero home-hover-chip');
        expect(surveys).toContain('social-neo-survey-take-card lux-soft-chrome home-hover-chip');
        expect(surveys).toContain('social-neo-survey-take-choice lux-soft-chrome home-hover-chip');
        expect(surveys).toContain('lux-primary-btn social-neo-survey-submit-btn home-hover-chip');
        expect(surveys).toContain('lux-secondary-btn home-hover-chip');
        expect(surveys).not.toContain('social-survey-back');
        expect(fouc).toContain('.social-neo-surveys-take-shell :is(');
        expect(fouc).toContain('.social-neo-survey-take-hero.home-hover-chip');
        expect(fouc).toContain('.social-neo-survey-take-card');
        expect(fouc).toContain('.social-neo-survey-take-choice');
        expect(bare).toContain('.social-neo-surveys-take-shell');
        expect(bare).toContain('.social-neo-survey-take-choice:has(input:checked)');
    });

    it('lux-modals includes survey-results KPI grid and overflow rules', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--survey-results .social-neo-surveys-results-kpis');
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--survey-results \.social-neo-surveys-results-kpis[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/
        );
        expect(modals).toContain('.lux-glass-dialog-card--survey-results .social-neo-survey-results-question');
        expect(modals).toMatch(/overflow:\s*visible/);
    });

    it('lux-fouc-ht includes survey-results matte paint block', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--survey-results');
        expect(fouc).toMatch(
            /\.lux-glass-dialog-card--survey-results[\s\S]*?:is\(\s*\.lux-strip-card\.surface-card,\s*\.lux-soft-chrome\.home-hover-chip\s*\)/
        );
    });

    it('social.html cache-busts survey take shell CSS', () => {
        const html = readSource('social.html');
        expect(html).toMatch(/lux-fouc-ht\.css\?v=20260806-hidetopbar2/);
        expect(html).toMatch(/lux-page-bare-lite\.css\?v=20260807-socialsurface1/);
    });
});
