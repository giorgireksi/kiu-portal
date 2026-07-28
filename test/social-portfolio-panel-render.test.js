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
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const portfolioRuntime = readSource('assets/js/pages/social-workspace-portfolio-runtime.js');

        expect(portfolioRuntime).toContain('const PORTFOLIO_DISCOVER_ROLE_TARGETS = [');
        expect(portfolioRuntime).toContain("['all', 'All audiences']");

        const renderHeroStart = portfolioUi.indexOf('function renderPortfolioHero(');
        const renderHeroEnd = portfolioUi.indexOf('function renderPortfolioCreateDialog(', renderHeroStart);
        const renderHeroBlock = portfolioUi.slice(renderHeroStart, renderHeroEnd > 0 ? renderHeroEnd : undefined);
        expect(renderHeroBlock).toContain('PORTFOLIO_DISCOVER_ROLE_TARGETS.map');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-tabs');
        expect(renderHeroBlock).toContain('portfolio-panel-tab-copy');
        expect(renderHeroBlock).toContain('lux-universal-native-select');
        expect(renderHeroBlock).toContain('class="lux-control" type="search"');
        expect(renderHeroBlock).not.toMatch(/class="social-neo-input lux-control" type="search"/);
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-discover');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-divider');
        expect(renderHeroBlock).toContain('social-neo-portfolio-hero-body');

        const renderProjectsStart = portfolioUi.indexOf('function renderProjectsPanel()');
        const renderProjectsEnd = portfolioUi.indexOf('return {', renderProjectsStart);
        const renderProjectsBlock = portfolioUi.slice(renderProjectsStart, renderProjectsEnd > 0 ? renderProjectsEnd : undefined);
        expect(renderProjectsBlock).not.toContain('roleTargets.map');
        expect(renderProjectsBlock).not.toContain('social-neo-card social-portfolio-toolbar');
        expect(renderProjectsBlock).toContain('social-neo-portfolio-shell--merged');
        expect(renderProjectsBlock).toContain('bodyHtml: panelBodyMarkup');
        expect(renderProjectsBlock).not.toContain('<section class="social-portfolio-feed');
        expect(renderProjectsBlock).toContain('social-neo-portfolio-feed-empty');
        expect(renderProjectsBlock).toContain('social-portfolio-card lux-soft-chrome');
        expect(renderProjectsBlock).toContain('social-neo-muted lms-route-meta-12');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain("['projects', 'groups', 'pages', 'events', 'lost-and-found', 'workspace', 'photography'].includes(activePanel)");
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('plan.center = true');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain("'portfolio-discover-search'");
        expect(readSource('assets/js/pages/social-workspace-events.js')).toContain('portfolio-panel-tab');
        expect(portfolioUi).toContain('portfolioPanelTab');
    });
});
