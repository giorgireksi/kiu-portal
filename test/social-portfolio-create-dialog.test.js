import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readWorkspaceSurface() {
    return readSource('assets/js/pages/social-workspace.js')
        + readSource('assets/js/pages/social-workspace-events.js')
        + readSource('assets/js/pages/social-workspace-portfolio-ui.js');
}

describe('social portfolio create dialog regressions', () => {
    it('opens the my portfolio editor tab instead of the legacy inline composer', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');

        expect((source + readWorkspaceSurface())).toContain("if (action === 'portfolio-create-open')");
        expect(readSource('assets/js/pages/social-profile.js') + source).toContain("state().ui.portfolioPanelTab = 'mine'");
        expect(readSource('assets/js/pages/social-profile.js')).toMatch(
            /profile-portfolio-open[\s\S]*?openDialog\('portfolio-editor'\)/
        );
        expect(source).toContain('hydrateMyPortfolioDocument');
        expect(source).toContain('renderMyPortfolioPanel');
        expect(source).not.toContain('data-action="portfolio-compose-open"');
        expect(source).not.toContain('social-portfolio-compose-shell');
        // CTA markup lives on portfolio hero in portfolio-ui module
        expect(portfolioUi).toContain('data-action="portfolio-create-open"');
        expect(portfolioUi).toContain('data-action="profile-portfolio-open"');

        const panelBlock = (() => {
            const a = portfolioUi.indexOf('function renderProjectsPanel()');
            const b = portfolioUi.indexOf('return {', a);
            return a >= 0 ? portfolioUi.slice(a, b > a ? b : undefined) : '';
        })();
        expect(panelBlock).not.toContain('social-portfolio-compose-shell');
        expect(panelBlock).toContain('data-portfolio-tab="mine"');
        expect(portfolioUi).toContain('function renderProjectsPanel');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('createKiuSocialWorkspacePortfolioUiApi');
    });
});
