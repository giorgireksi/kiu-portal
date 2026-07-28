import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-portfolio-editor-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('restores portfolio editor module and workspace load chain', () => {
        const editor = readSource('assets/js/pages/social-workspace-portfolio-editor.js');
        const page = readSource('assets/js/pages/social-page.js');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');

        expect(editor).toContain('window.KiuPortfolioEditor');
        expect(editor).toContain('renderEditor');
        expect(editor).toContain('renderSection');
        expect(editor).toContain('portfolio-editor-stack');
        expect(editor).toContain('portfolio-section-card');
        expect(editor).toContain('portfolio-section-empty');
        expect(editor).not.toContain('social-neo-empty portfolio-section-empty');
        expect(editor).toContain('basicsLinkUrl');
        expect(editor).toContain('lux-glass-dialog-backdrop--stacked-child');
        expect(editor).toContain('lux-glass-dialog-card--portfolio-custom');
        expect(editor).toContain('portfolio-custom-template-card');
        expect(editor).not.toMatch(/social-neo-muted[^"]*">Pick a starter template/);
        expect(editor).toContain('window.KiuPortfolioApi');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(interactions).toContain("dep('ensureMyPortfolioDocument')");
        expect(interactions).toContain("dep('portfolioCollectDocumentFromUi')");
        expect(page).toMatch(/__socialInteractionsDeps[\s\S]*ensureMyPortfolioDocument/);
        expect(portfolioUi).toContain('KiuPortfolioEditor?.renderEditor');
        expect(portfolioUi).toContain('Portfolio editor is loading');
        expect(portfolioUi).toContain('${renderPortfolioCustomBuilderOverlay()}');
        expect(portfolioUi).not.toContain('renderMyPortfolioPanel()}\n                        ${renderPortfolioCustomBuilderOverlay()}');
        expect(bare).toContain('.portfolio-editor-stack');
        expect(modals).toContain('.lux-glass-dialog-card--portfolio-editor');
        expect(modals).toContain('.lux-glass-dialog-card--portfolio-custom');
        expect(modals).toContain('.sns-portfolio-editor-panel');
        expect(portfolioUi).toContain('portfolio-editor-dialog-head');
        expect(portfolioUi).toContain('social-neo-surveys-hero-head');
    });
});
