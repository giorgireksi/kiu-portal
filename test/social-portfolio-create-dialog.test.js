import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social portfolio create dialog regressions', () => {
    it('opens the my portfolio editor tab instead of the legacy inline composer', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("if (action === 'portfolio-create-open')");
        expect(source).toContain("state().ui.portfolioPanelTab = 'mine'");
        expect(source).toContain('hydrateMyPortfolioDocument');
        expect(source).toContain('renderMyPortfolioPanel');
        expect(source).not.toContain('data-action="portfolio-compose-open"');
        expect(source).not.toContain('social-portfolio-compose-shell');
        // CTA markup lives on portfolio hero in workspace module
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('data-action="portfolio-create-open"');

        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const panelBlock = (() => {
            const a = workspaceModule.indexOf('function renderProjectsPanel()');
            const b = workspaceModule.indexOf('window.renderProjectsPanel =', a);
            return a >= 0 ? workspaceModule.slice(a, b > a ? b : undefined) : '';
        })();
        expect(panelBlock).not.toContain('social-portfolio-compose-shell');
        expect(panelBlock).toContain('data-portfolio-tab="mine"');
        expect(source).toContain('function renderProjectsPanel');
    });
});