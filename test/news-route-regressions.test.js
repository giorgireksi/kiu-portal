const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/**
 * Bare-shell era: route paint CSS removed. Page uses shared lux stack + lux-page-bare.
 * Full visuals kept only on timetable / LMS / social.
 */
describe('news bare shell', () => {
    it('uses bare shell (no dedicated route paint sheet)', () => {
        const html = readSource('news.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'news-route.css'))).toBe(false);
        expect(html).not.toContain('news-route.css');
    });

    it('still loads shared panel SSOT stack', () => {
        const html = readSource('news.html');
        expect(html).toContain('lux-tokens.css');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('frostedpopup1');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).toContain('#portal-news-root .newsx-shell');
        const newsBlock = bare.slice(bare.indexOf('/* ── News workspace'));
        expect(newsBlock).not.toContain('--news-fade-');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('--lux-panel-surface-soft');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
    });

    it('dual-writes lux-soft-chrome on feed cards', () => {
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        expect(feed).toContain('lux-soft-chrome newsx-panel newsx-feed-card');
        expect(feed).toContain('newsx-header-bar newsx-filter home-hover-chip');
        expect(feed).toContain('newsx-feed-card newsx-loading-card home-hover-chip');
        expect(feed).toContain('newsx-feed-card newsx-post-card--editorial home-hover-chip');
    });

    it('uses shared shell classes and home-hover-chip on news sidebar', () => {
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(feed).toContain('newsx-sidebar home-hover-chip');
        expect(feed).toContain('lux-section-kicker');
        expect(feed).toContain('newsx-account-name lux-card-title');
        expect(feed).toContain('newsx-section-key lux-card-meta lms-route-meta-12');
        expect(bare).toContain('body.lux-route-news #portal-news-root .newsx-sidebar.home-hover-chip');
        expect(bare).not.toMatch(/#portal-news-root \.newsx-sidebar\s*\{[^}]*--lux-panel-surface/);
        expect(fouc).toContain('body.lux-route-news #portal-news-root :is(');
        expect(fouc).toContain('.newsx-header-bar');
        expect(fouc).toContain('.lux-empty-state');
        expect(fouc).toContain('.lux-empty-state.newsx-empty');
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
    });

    it('styles markdown and publisher editor chrome in shared CSS', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const controls = readSource('assets/css/lux-controls.css');
        const publisher = readSource('assets/js/pages/news/news-publisher.js');
        expect(bare).toContain('.newsx-card-body--rich :is(.newsx-md-h2');
        expect(bare).toContain('a.newsx-attachment-chip');
        expect(bare).toContain('.newsx-section-btn.lux-secondary-btn');
        expect(bare).not.toMatch(/\.newsx-section-btn\s*\{[^}]*border-radius/);
        expect(controls).toContain('.lux-select-card.lux-secondary-btn');
        expect(modals).toContain('.newsx-publisher-modal .newsx-editor-ribbon');
        expect(modals).toContain('.newsx-publisher-modal .newsx-rich-editor');
        expect(modals).toContain('.newsx-publisher-modal :is(.newsx-publisher-radio-card, .lux-check-card');
        expect(modals).toContain('.newsx-confirm-title');
        expect(modals).toContain('[data-lux-transparency-exempt="1"] .newsx-publisher-modal :is(');
        expect(modals).toContain('.newsx-publisher-section-tab.home-hover-chip');
        expect(modals).toContain('.newsx-publisher-header');
        expect(modals).toContain('.newsx-publisher-footer');
        expect(publisher).toContain('newsx-publisher-section-tab home-hover-chip');
        expect(publisher).toContain('newsx-editor-ribbon home-hover-chip');
        expect(publisher).toContain('newsx-publisher-radio-card home-hover-chip');
        expect(publisher).toContain('newsx-publisher-toggle-card home-hover-chip');
        expect(publisher).toContain('newsx-publisher-pane home-hover-chip');
        expect(publisher).toContain('newsx-attachment-chip home-hover-chip');
    });
});
