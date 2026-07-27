import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-survey-create-dialog.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('survey create dialog uses shared social-glass shell', () => {
        const surveys = readSource('assets/js/pages/social-surveys.js');
        const createFormLine = surveys.split('\n').find((line) => line.includes('data-form="survey-create"') && line.includes('<form'));
        expect(createFormLine).toBeTruthy();
        expect(createFormLine).toContain('lux-glass-dialog-card--social-glass');
        expect(createFormLine).not.toContain('social-neo-card');
    });

    it('lux-modals includes survey-create interior layout selectors', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--survey-create');
        expect(modals).toContain('--survey-create-section');
        expect(modals).toContain('.social-neo-surveys-create-question-layout');
        expect(modals).toContain('.social-neo-survey-question-rail');
        expect(modals).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    });

    it('does not override lux-picker-panel paint inside survey-create dialog', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).not.toMatch(
            /\.lux-glass-dialog-card--survey-create[\s\S]*?\.lux-picker-panel\s*\{[^}]*background:/
        );
    });

    it('survey create toggle row uses shared lux-checkbox chip markup', () => {
        const surveys = readSource('assets/js/pages/social-surveys.js');

        expect(surveys).toContain('lux-checkbox-row social-neo-inline social-neo-surveys-create-toggle-row');
        expect(surveys).toContain('lux-checkbox lux-checkbox--chip social-neo-checkbox');
        expect(surveys).toContain('name="surveyAnonymous"');
        expect(surveys).toContain('name="surveyPromoteFeed"');
    });
});
