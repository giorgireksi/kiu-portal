import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social portfolio panel render regressions', () => {
    it('keeps discover role options scoped to the portfolio panel renderer', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');

        expect(workspaceModule).toContain('const PORTFOLIO_DISCOVER_ROLE_TARGETS = [');
        expect(workspaceModule).toContain("['all', 'All audiences']");

        const renderHeroStart = workspaceModule.indexOf('function renderPortfolioHero(');
        const renderHeroEnd = workspaceModule.indexOf('function renderPortfolioCreateDialog(', renderHeroStart);
        const renderHeroBlock = workspaceModule.slice(renderHeroStart, renderHeroEnd > 0 ? renderHeroEnd : undefined);
        expect(renderHeroBlock).toContain('PORTFOLIO_DISCOVER_ROLE_TARGETS.map');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-tabs');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-discover');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-divider');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-body');

        // Panel body lives in workspace module (page keeps a loading stub).
        const renderProjectsStart = workspaceModule.indexOf('function renderProjectsPanel()');
        const renderProjectsEnd = workspaceModule.indexOf('window.renderProjectsPanel =', renderProjectsStart);
        const renderProjectsBlock = workspaceModule.slice(renderProjectsStart, renderProjectsEnd > 0 ? renderProjectsEnd : undefined);
        expect(renderProjectsBlock).not.toContain('roleTargets.map');
        expect(renderProjectsBlock).not.toContain('social-neo-card social-portfolio-toolbar');
        expect(renderProjectsBlock).toContain('social-neo-portfolio-shell--merged');
        expect(renderProjectsBlock).toContain('bodyHtml: panelBodyMarkup');
        expect(renderProjectsBlock).not.toContain('<section class="social-portfolio-feed');
        expect(renderProjectsBlock).toContain('social-neo-portfolio-feed-empty');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain("['projects', 'groups', 'pages', 'events', 'lost-and-found', 'workspace', 'photography'].includes(activePanel)");
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('plan.center = true');
        expect((source + workspaceModule)).toContain("'portfolio-discover-search'");
        expect(source).toContain('portfolio-panel-tab');
        expect(source).toContain('portfolioPanelTab');
    });
});
