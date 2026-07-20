import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS quiz preview visual regressions', () => {
    it('uses slim preview header and draft placeholders', () => {
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');

        expect(quizSource).toContain('function renderLmsQuizPreviewQuestionText(text)');
        expect(quizSource).toContain('function renderLmsQuizPreviewOptionCopy(option, optionIndex)');
        expect(quizSource).toContain('lms-quiz-preview-placeholder');
        expect(quizSource).toContain('Question text not entered yet');
        expect(quizSource).toContain("title: 'Student Preview'");
        expect(quizSource).toContain('renderLmsGlassDialogCard');
        expect(quizSource).not.toContain('lms-quiz-board-copy');
        expect(quizSource).not.toContain('lms-quiz-board-title');
        expect(quizSource).toContain('lms-quiz-preview-title');
    });

    it('styles preview modal with fade-glass tokens', () => {
    });

    it('includes student quiz cards in terminal soft-fade polish pass', () => {
    });

    it('uses theme tokens for student quiz titles instead of kiu-navy', () => {
    });

    it('uses theme tokens for publish quiz access dialog titles', () => {
            /\.social-neo-dialog-card--lms-create \.social-neo-dialog-title[\s\S]{0,400}color:\s*var\(--lux-text\)/
        );
    });

    it('uses theme tokens for quiz list card titles and stat values', () => {
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        expect(quizSource).toContain('lms-quiz-card-divider');
        expect(quizSource).toContain('lms-quiz-board-card-list');
        expect(quizSource).toContain('lms-quiz-card-meta-stack');
    });

    it('uses compact sizing for quiz board lifecycle cards', () => {
        const quizSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
            /#lms-quiz-board-modal > \.lms-quiz-board-modal[\s\S]{0,400}height:\s*min\(85vh, 920px\)/
        );
            /#lms-quiz-board-modal > \.lms-quiz-board-modal[\s\S]{0,500}min-height:\s*min\(72vh, 680px\)/
        );
            /#lms-quiz-board-modal > \.lms-quiz-board-modal \.lms-quiz-board-body[\s\S]{0,300}overflow:\s*hidden/
        );
            /#lms-quiz-board-modal > \.lms-quiz-board-modal \.lms-quiz-board-card-list[\s\S]{0,200}overflow-y:\s*auto/
        );
            /\.lms-quiz-board-modal \.lms-quiz-board-body[\s\S]{0,300}gap:\s*6px/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-divider[\s\S]{0,80}display:\s*none/
        );
            /\.lms-quiz-board-modal \.lms-quiz-board-tabs-rail[\s\S]{0,300}grid-template-columns:\s*auto minmax\(0, 1fr\) auto/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card[\s\S]{0,400}padding:\s*8px 10px/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-stats[\s\S]{0,300}display:\s*flex/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-stats[\s\S]{0,300}background:\s*var\(--lms-fade-control\)/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-stats[\s\S]{0,200}--lux-bg-soft/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-stat-value[\s\S]{0,200}font-size:\s*14px/
        );
            /\.lms-quiz-board-modal \.lms-quiz-board-tab[\s\S]{0,400}min-height:\s*28px !important/
        );
            /\.lms-quiz-board-modal \.lms-quiz-card-action[\s\S]{0,200}min-height:\s*28px !important/
        );
        expect(quizSource).toContain('data-lms-quiz-board-tabs-rail');
        expect(quizSource).toContain("shellSelector: '[data-lms-quiz-board-tabs-rail]'");
        expect(quizSource).toContain('initLuxScrollRail');
    });
});
