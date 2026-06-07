import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('News route regressions', () => {
    it('keeps news as a real standalone route with its own shell bootstrap', () => {
        const navigationJs = readAsset('assets/js/features/navigation.js');
        const appJs = readAsset('assets/js/app/app.js');
        const indexHtml = readAsset('index.html');
        const newsHtml = readAsset('news.html');

        expect(navigationJs).toContain('const PORTAL_STANDALONE_ROUTE_IDS = new Set([');
        expect(navigationJs).toContain("'news'");
        expect(navigationJs).toContain("'news': 'news.html'");
        expect(appJs).toContain("const NEWS_RUNTIME_SCRIPT = 'assets/js/pages/news.js?v=20260516-newsroute3';");
        expect(appJs).toContain('window.ensurePortalNewsRuntimeLoaded = function ensurePortalNewsRuntimeLoaded()');
        expect(indexHtml).toContain('id="page-news"');
        expect(indexHtml).toContain('id="portal-news-root"');
        expect(indexHtml).toContain('assets/css/news-route.css?v=20260530-newsfx1');
        expect(newsHtml).toContain('id="page-news"');
        expect(newsHtml).toContain('id="portal-news-root"');
        expect(newsHtml).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(newsHtml).toContain('assets/js/pages/news.js?v=20260516-newsroute3');
        expect(newsHtml).toContain('assets/css/news-route.css?v=20260530-newsfx1');
        expect(newsHtml).toContain('bootStandaloneNewsPage');
        expect(newsHtml).not.toContain("window.location.replace(target);");
    });

    it('keeps news rendering from full root churn on identical markup', () => {
        const newsJs = readAsset('assets/js/pages/news.js');

        expect(newsJs).toContain('renderCache');
        expect(newsJs).toContain('function ensureNewsWorkspaceShell(root)');
        expect(newsJs).toContain('function ensureNewsFeedShell(container)');
        expect(newsJs).toContain('function ensureNewsPostShell(host, postId)');
        expect(newsJs).toContain('function renderNewsPostRegions(host, post)');
        expect(newsJs).toContain('function renderNewsFeedRegions(container)');
        expect(newsJs).toContain("setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());");
        expect(newsJs).toContain("setNewsRegionMarkup(shell.hero, 'hero', renderNewsHero(currentUser));");
        expect(newsJs).toContain('renderNewsFeedRegions(shell.feed);');
        expect(newsJs).toContain('feed-post-header:${postId}');
        expect(newsJs).toContain('feed-post-audience:${postId}');
        expect(newsJs).toContain('feed-post-body:${postId}');
        expect(newsJs).toContain('feed-post-private:${postId}');
        expect(newsJs).not.toContain('root.innerHTML = markup');
        expect(newsJs).not.toContain('function renderPostCard(post)');
        expect(newsJs).not.toContain('.newsx-feed-card:nth-child(2)');
    });

    it('keeps the news shell free of dead social and page-pack imports', () => {
        const newsHtml = readAsset('news.html');

        expect(newsHtml).not.toContain('assets/js/shared/social-hub.js');
        expect(newsHtml).not.toContain('assets/js/shared/social-render.js');
        expect(newsHtml).not.toContain('assets/js/shared/social-media.js');
        expect(newsHtml).not.toContain('assets/js/shared/messenger.js');
        expect(newsHtml).not.toContain('assets/js/pages/gradebook.js');
        expect(newsHtml).not.toContain('assets/js/pages/lms.js');
        expect(newsHtml).not.toContain('assets/js/pages/registration.js');
        expect(newsHtml).not.toContain('assets/js/pages/planner.js');
        expect(newsHtml).not.toContain('assets/js/pages/directories.js');
        expect(newsHtml).not.toContain('assets/js/pages/student-registration.js');
        expect(newsHtml).not.toContain('assets/js/pages/admin-registration.js');
        expect(newsHtml).not.toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(newsHtml).not.toContain('assets/js/pages/standalone-mobile-shell.js?v=20260518-standalone-shell1');
        expect(newsHtml).not.toContain('(function initMobileExperience(){');
        expect(newsHtml).not.toContain('setInterval(function(){if(typeof window.navigate===');
    });

    it('keeps news route styling in CSS and runtime actions delegated through data attributes', () => {
        const newsJs = readAsset('assets/js/pages/news.js');
        const newsCss = readAsset('assets/css/news-route.css');

        expect(newsJs).not.toContain('onclick=');
        expect(newsJs).not.toContain('oninput=');
        expect(newsJs).not.toContain('onchange=');
        expect(newsJs).not.toContain('createElement(\'style\')');
        expect(newsJs).not.toContain('STYLE_ID');
        expect(newsJs).toContain('installNewsWorkspaceDelegates');
        expect(newsJs).toContain('data-news-submit-reply');
        expect(newsJs).toContain('data-news-compose-field');
        expect(newsJs).toContain('class="surface-card newsx-panel newsx-sidebar"');
        expect(newsJs).toContain('class="lux-summary-surface lux-summary-surface--hero newsx-hero"');
        expect(newsJs).toContain('class="surface-card newsx-panel newsx-filter"');
        expect(newsJs).toContain('class="newsx-btn lux-secondary-btn"');
        expect(newsJs).toContain('class="newsx-btn newsx-btn-primary lux-primary-btn"');
        expect(newsJs).toContain('class="newsx-pane-btn lux-secondary-btn lux-select-card');
        expect(newsJs).toContain('class="newsx-section-btn lux-secondary-btn lux-select-card');
        expect(newsJs).toContain('class="newsx-account-card lux-select-card lux-summary-surface lux-summary-surface--panel');
        expect(newsJs).toContain('class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel');
        expect(newsJs).toContain('class="lux-empty-state newsx-empty"');
        expect(newsJs).toContain('class="lux-empty-state lux-error-state newsx-error"');
        expect(newsCss).toContain('#portal-news-root .newsx-feed-card');
        expect(newsCss).toContain('content-visibility: auto;');
        expect(readAsset('assets/css/lux-surfaces.css')).toContain('.lux-select-card {');
        expect(readAsset('assets/css/lux-surfaces.css')).toContain('.lux-check-card {');
        expect(newsCss).not.toContain('#portal-news-root .newsx-section-btn:hover,');
        expect(newsCss).not.toContain('#portal-news-root .newsx-check input {');
        expect(newsCss).not.toContain('#portal-news-root .newsx-panel,\n#portal-news-root .newsx-hero {');
    });

    it('loads the privilege workspace on demand instead of front-loading it for every news boot', () => {
        const newsJs = readAsset('assets/js/pages/news.js');

        expect(newsJs).toContain('privilegesLoaded: false');
        expect(newsJs).toContain('function shouldLoadNewsPrivileges()');
        expect(newsJs).toContain("return canManagePrivileges() && (runtime.adminPane === 'privileges' || runtime.privilegesLoaded);");
        expect(newsJs).toContain('async function loadNewsPrivilegeWorkspace(force = false)');
        expect(newsJs).toContain("if (runtime.adminPane === 'privileges' && !runtime.privilegesLoaded) {");
        expect(newsJs).toContain('Loading privilege controls...');
        expect(newsJs).toContain('tasks.push(fetchNewsPrivilegeWorkspaceData());');
    });
});
