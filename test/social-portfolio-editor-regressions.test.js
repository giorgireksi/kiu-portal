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

    it('portfolio editor is resume-first with optional extras', () => {
        const editor = readSource('assets/js/pages/social-workspace-portfolio-editor.js');
        const page = readSource('assets/js/pages/social-page.js');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const runtime = readSource('assets/js/pages/social-workspace-portfolio-runtime.js');

        expect(editor).toContain('window.KiuPortfolioEditor');
        expect(editor).toContain('renderEditor');
        expect(editor).toContain('renderViewer');
        expect(editor).toContain('loadPortfolio');
        const viewerSource = editor.slice(editor.indexOf('function renderViewer'), editor.indexOf('function renderResumeBlock(resume)'));
        expect(viewerSource).not.toContain('portfolio-save');
        expect(viewerSource).not.toContain('portfolio-extra-add');
        expect(viewerSource).toContain('data-form="portfolio-viewer"');
        expect(editor).toContain('portfolio-editor-stack');
        expect(editor).toContain('name="portfolioResumeFile"');
        expect(editor).toContain('Optional extras');
        expect(editor).toContain('data-action="portfolio-extra-add"');
        expect(editor).toContain('Discover card');
        expect(editor).not.toContain('data-action="portfolio-custom-open"');
        expect(editor).not.toContain('portfolio-section-card');
        expect(editor).toContain('basicsLinkUrl');
        expect(editor).toContain('window.KiuPortfolioApi');
        expect(editor).toContain('X-Portal-Session');
        expect(editor).toContain('kiuPortalFetch');
        expect(editor).toContain('getPortalSessionToken');
        expect(runtime).toContain('readPortfolioResumeFile');
        expect(runtime).toContain('portfolio-doc:');
        expect(runtime).toContain('isPortfolioDocument: true');
        expect(runtime).toMatch(/if \(force\)\s*myPortfolioApiDenied\s*=\s*false/);
        const html = readSource('social.html');
        expect(html).toContain('social-page.js?v=20260802-escapefix1');
        expect(html).toContain('social-fingerprint-model.js?v=20260801-portfolioresume4');
        expect(html).toContain('social-render-plan.js?v=20260801-researchfiles1');
        expect(html).toContain('social-page-feed-runtime.js?v=20260802-portfolio-viewer1');
        expect(page).toContain('social-workspace-portfolio-editor.js?v=20260802-portfolio-viewer3');
        expect(page).toContain('social-workspace-portfolio-runtime.js?v=20260802-portfolio-viewer1');
        expect(page).toContain('social-workspace-portfolio-ui.js?v=20260802-portfolio-viewer1');
        expect(page).toContain('social-workspace-events.js?v=20260802-portfolio-viewer1');
        const fingerprint = readSource('assets/js/pages/social-fingerprint-model.js');
        expect(fingerprint).toMatch(/buildPortfolioFingerprint[\s\S]*extras\.length/);
        const renderPlan = readSource('assets/js/pages/social-render-plan.js');
        expect(renderPlan).toContain("'portfolio-extra-add'");
        expect(renderPlan).toContain("'portfolio-extra-remove'");
        expect(renderPlan).toContain("'portfolio-resume-clear'");
        const events = readSource('assets/js/pages/social-workspace-events.js');
        expect(events).toMatch(/portfolio-create-open[\s\S]*?finally\s*\{\s*openDialog\('portfolio-editor'\)/);
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(interactions).toContain("dep('ensureMyPortfolioDocument')");
        expect(interactions).toContain("dep('portfolioCollectDocumentFromUi')");
        expect(page).toMatch(/__socialInteractionsDeps[\s\S]*ensureMyPortfolioDocument/);
        expect(portfolioUi).toContain('KiuPortfolioEditor?.renderEditor');
        expect(portfolioUi).toContain('renderPortfolioViewerDialog');
        expect(portfolioUi).toContain('KiuPortfolioEditor?.renderViewer');
        expect(portfolioUi).toContain('Upload my resume');
        expect(portfolioUi).toContain('View resume');
        expect(bare).toContain('.portfolio-editor-stack');
        expect(modals).toContain('.lux-glass-dialog-card--portfolio-editor');
        expect(modals).toContain('.sns-portfolio-editor-panel');
        expect(portfolioUi).toContain('portfolio-editor-dialog-head');
    });
});
