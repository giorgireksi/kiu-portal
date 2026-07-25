import { describe, expect, it } from 'vitest';

import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS quiz preview visual regressions', () => {
    it('styles quiz board modals via lux-modals warmglass SSOT', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');

        expect(modals).toContain('.lms-glass-dialog-overlay');
        expect(modals).toContain('--lux-modal-glass-surface');
        expect(modals).toContain('.lms-quiz-board-modal .lms-quiz-card-stats');
        expect(modals).toMatch(/\.lms-quiz-board-modal \.lms-quiz-card-stats[\s\S]*background:\s*var\(--lux-panel-control\)/);
        expect(quizSource).toContain('renderLmsGlassDialogCard');
        expect(quizSource).toContain('lms-glass-dialog-overlay');
        expect(quizSource).toContain('data-lux-transparency-exempt');
    });

    it('uses theme tokens for publish quiz access dialog titles', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(
            /\.lux-glass-dialog-card[\s\S]*--lux-modal-glass-surface/
        );
    });

    it('uses compact sizing for quiz board lifecycle cards', () => {
        const modals = readSource('assets/css/lux-modals.css');

        expect(modals).toMatch(
            /#lms-quiz-board-modal > \.lms-quiz-board-modal[\s\S]{0,400}height:\s*min\(85vh, 920px\)/
        );
        expect(modals).toMatch(
            /#lms-quiz-board-modal > \.lms-quiz-board-modal[\s\S]{0,500}min-height:\s*min\(72vh, 680px\)/
        );
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-board-body[\s\S]{0,300}overflow:\s*hidden/
        );
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-board-card-list[\s\S]{0,200}overflow-y:\s*auto/
        );
        expect(modals).toMatch(/\.lms-quiz-board-modal \.lms-quiz-board-body[\s\S]{0,300}gap:\s*6px/);
        expect(modals).toMatch(/\.lms-quiz-board-modal \.lms-quiz-card-divider[\s\S]{0,80}display:\s*none/);
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-board-tabs-rail[\s\S]{0,300}grid-template-columns:\s*auto minmax\(0, 1fr\) auto/
        );
        expect(modals).toMatch(/\.lms-quiz-board-modal \.lms-quiz-card[\s\S]{0,400}padding:\s*8px 10px/);
        expect(modals).toMatch(/\.lms-quiz-board-modal \.lms-quiz-card-stats[\s\S]{0,300}display:\s*flex/);
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-card-stat-value[\s\S]{0,200}font-size:\s*14px/
        );
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-board-tab[\s\S]{0,400}min-height:\s*28px !important/
        );
        expect(modals).toMatch(
            /\.lms-quiz-board-modal \.lms-quiz-card-action[\s\S]{0,200}min-height:\s*28px !important/
        );
    });
});
