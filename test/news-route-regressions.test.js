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
        expect(html).toContain('lux-layout-primitives.css');
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
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');
        const events = readSource('assets/js/pages/news/news-events.js');
        expect(feed).toContain('lux-soft-chrome newsx-panel newsx-feed-card');
        expect(feed).toContain('newsx-header-bar newsx-filter home-hover-chip');
        expect(feed).toContain('newsx-feed-card newsx-loading-card newsx-post-card--tile home-hover-chip');
        expect(feed).toContain('newsx-feed-card newsx-post-card--tile home-hover-chip');
        expect(feed).toContain('data-news-open-post');
        expect(feed).toContain('function openNewsPostDetail');
        expect(feed).toContain('function renderNewsPostDetailPanel');
        expect(feed).toContain('class="newsx-post-card--editorial"');
        expect(feed).not.toContain('newsx-post-card--editorial home-hover-chip');
        expect(feed).not.toMatch(/data-news-post-detail-shell[\s\S]*?lux-soft-chrome/);
        expect(feed).toContain('renderPostHeader(post, { omitTitle: true })');
        expect(feed).toContain('renderPostBody(post)');
        expect(feed).toContain('loading="lazy" decoding="async"');
        expect(runtime).toContain("POST_DETAIL_OVERLAY_ID = 'newsx-post-detail-overlay'");
        expect(events).toContain('[data-news-open-post]');
        expect(events).toContain('[data-news-close-post-detail]');
        expect(events).toContain('[data-news-post-detail-scroll-btn]');
        expect(feed).toContain('data-news-post-detail-scroll-btn');
        expect(feed).toContain('bindNewsPostDetailScrollChrome');
        expect(feed).toContain('syncNewsPostDetailScrollBtn');
        expect(bare).toContain('grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))');
        expect(bare).toContain('.newsx-post-card--tile');
        expect(bare).toContain(':is(#portal-news-root, #newsx-post-detail-panel) .newsx-attachment-gallery');
        expect(bare).toContain(':is(#portal-news-root, #newsx-post-detail-panel) .newsx-card-header');
        expect(bare).toContain(':is(#portal-news-root, #newsx-post-detail-panel) .newsx-card-body--rich');
        expect(bare).toContain('minmax(min(100%, 140px), 1fr)');
        expect(bare).toMatch(/\.newsx-attachment-thumb img\s*\{[^}]*max-height:\s*200px[^}]*object-fit:\s*cover/);
        expect(bare).not.toMatch(/\.newsx-attachment-thumb img\s*\{[^}]*max-height:\s*min\(56vh, 520px\)/);
        expect(modals).toContain('.modal-content.newsx-post-detail-modal');
        expect(modals).toContain('#newsx-post-detail-overlay.modal-overlay');
        expect(modals).toContain('.newsx-post-detail-scroll-btn');
        expect(modals).toMatch(/\.modal-content\.newsx-post-detail-modal\s*\{[^}]*height:\s*100%[^}]*max-height:\s*none/);
        expect(modals).toMatch(/#newsx-post-detail-overlay\.modal-overlay\s*\{[^}]*padding:\s*0/);
        expect(modals).toMatch(/#newsx-post-detail-overlay\.modal-overlay\s*\{[^}]*background:\s*var\(--lux-bg/);
        expect(modals).toMatch(/#newsx-post-detail-overlay\.modal-overlay \.newsx-post-detail-modal\s*\{[^}]*backdrop-filter:\s*none/);
        expect(modals).toMatch(/#newsx-post-detail-overlay \.newsx-post-detail-head\s*\{[^}]*background:\s*var\(--lux-panel-surface\)/);
        expect(modals).toMatch(/#newsx-post-detail-overlay \.newsx-post-detail-scroll\s*\{[^}]*max-width:\s*none/);
        expect(modals).toMatch(/#newsx-post-detail-overlay \.newsx-post-detail-scroll \.newsx-post-card--editorial\s*\{[^}]*max-width:\s*none/);
        expect(modals).not.toMatch(/#newsx-post-detail-overlay \.newsx-post-detail-scroll\s*\{[^}]*max-width:\s*min\(920px/);
        expect(modals).toMatch(/\.newsx-post-detail-modal #newsx-post-detail-panel\s*\{[^}]*height:\s*100%[^}]*max-height:\s*none/);
        expect(modals).not.toMatch(/\.modal-content\.newsx-post-detail-modal\s*\{[^}]*min\(760px/);
        expect(modals).not.toMatch(/\.newsx-post-detail-modal #newsx-post-detail-panel\s*\{[^}]*88dvh/);
        expect(modals).toMatch(/#newsx-attachment-viewer-overlay\.modal-overlay\s*\{[^}]*z-index:\s*2050/);
        expect(modals).toMatch(/#newsx-publisher-overlay\.modal-overlay\s*\{[^}]*z-index:\s*2080/);
        expect(events).toContain('data-news-edit-post');
        expect(events).toContain('closeNewsPostDetail()');
        expect(events).toContain('closeNewsAttachmentViewer()');
        expect(readSource('news.html')).toContain('lux-modals.css?v=20260820-newssectionsfix1');
        expect(readSource('news.html')).toContain('lux-page-bare-lite.css?v=20260820-newsfullscreen1');
        expect(readSource('news.html')).toContain('news-feed-render.js?v=20260806-newssectioncollapse1');
        expect(readSource('news.html')).toContain('news-events.js?v=20260806-newssectioncollapse1');
        expect(readSource('news.html')).toContain('news-runtime.js?v=20260806-newssectioncollapse1');
    });

    it('collapses news feed filters behind a mobile Filters toggle', () => {
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        const events = readSource('assets/js/pages/news/news-events.js');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(runtime).toContain('headerFiltersCollapsed: null');
        expect(runtime).toContain('function ensureNewsHeaderFiltersCollapsed');
        expect(runtime).toContain("matchMedia('(max-width: 920px)')");
        expect(feed).toContain('data-news-toggle-filters');
        expect(feed).toContain('newsx-filter-toggle');
        expect(feed).toContain('id="newsx-filter-collapse"');
        expect(feed).toContain('newsx-filter-collapse${filtersCollapsed ? \' is-collapsed\' : \'\'}');
        expect(events).toContain('[data-news-toggle-filters]');
        expect(events).toContain('window.toggleNewsHeaderFilters');
        expect(events).toContain('runtime.headerFiltersCollapsed');
        expect(bare).toContain('#portal-news-root .newsx-filter-toggle');
        expect(bare).toMatch(/#portal-news-root \.newsx-filter-toggle\s*\{[^}]*display:\s*inline-flex/);
        expect(bare).toMatch(
            /#portal-news-root \.newsx-header-bar\.is-collapsed \.newsx-filter-collapse[\s\S]*?display:\s*none/
        );
    });

    it('collapses news sections sidebar behind a Sections toggle', () => {
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        const events = readSource('assets/js/pages/news/news-events.js');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(runtime).toContain('sidebarSectionsCollapsed: null');
        expect(runtime).toContain('function ensureNewsSidebarSectionsCollapsed');
        expect(feed).toContain('data-news-toggle-sections');
        expect(feed).toContain('newsx-sections-toggle');
        expect(feed).toContain('id="newsx-sections-collapse"');
        expect(feed).toContain('newsx-sections-collapse${sectionsCollapsed ? \' is-collapsed\' : \'\'}');
        expect(events).toContain('[data-news-toggle-sections]');
        expect(events).toContain('window.toggleNewsSidebarSections');
        expect(events).toContain('runtime.sidebarSectionsCollapsed');
        expect(bare).toContain('#portal-news-root .newsx-sections-toggle');
        expect(bare).toMatch(/#portal-news-root \.newsx-sections-toggle\s*\{[^}]*display:\s*inline-flex/);
        expect(bare).toMatch(
            /#portal-news-root \.newsx-sidebar\.is-collapsed \.newsx-sections-collapse[\s\S]*?display:\s*none/
        );
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
        expect(publisher).toContain('newsx-publisher-section-tab lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-editor-ribbon lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-radio-card lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-toggle-card lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-pane lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-attachment-chip lux-soft-chrome home-hover-chip');
    });

    it('opens Outlook-style attachment viewer from feed thumbs', () => {
        const html = readSource('news.html');
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        const events = readSource('assets/js/pages/news/news-events.js');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');
        const modals = readSource('assets/css/lux-modals.css');
        expect(html).toContain('id="newsx-attachment-viewer-overlay"');
        expect(html).toContain('newsx-attachment-viewer-modal');
        expect(runtime).toContain("ATTACHMENT_VIEWER_OVERLAY_ID = 'newsx-attachment-viewer-overlay'");
        expect(feed).toContain('data-news-open-attachment');
        expect(feed).toContain('data-news-attachment-index');
        expect(feed).toContain('function openNewsAttachmentViewer');
        expect(feed).toContain('renderPostRepliesBox(post)');
        expect(feed).not.toContain('renderPostRepliesBox(post, openState)');
        expect(feed).toContain('newsx-attachment-viewer-frame');
        expect(events).toContain('data-news-open-attachment');
        expect(events).toContain('data-news-attachment-prev');
        expect(events).toContain('ATTACHMENT_VIEWER_OVERLAY_ID');
        expect(modals).toContain('.newsx-attachment-viewer-modal');
        expect(modals).toContain('max-height: min(78dvh, 860px)');
        expect(modals).toContain('max-width: min(100%, 1100px)');
        expect(modals).toContain('#newsx-attachment-viewer-overlay.modal-overlay');
        expect(modals).toMatch(/#newsx-attachment-viewer-overlay\.modal-overlay\s*\{[^}]*z-index:\s*2050/);
        expect(modals).toContain('padding: 0');
        expect(modals).toContain('minmax(360px, min(480px, 38vw))');
        expect(modals).not.toMatch(/\.newsx-attachment-viewer-frame\s+img\s*\{[^}]*100vw/);
        expect(modals).not.toMatch(/\.newsx-attachment-viewer-frame\s+img\s*\{[^}]*100vh/);
        expect(modals).not.toContain('.newsx-attachment-viewer-replies .newsx-textarea');
    });

    it('draws shared news reply trunks in feed and attachment viewer', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain(':is(#portal-news-root, #newsx-attachment-viewer-panel, #newsx-post-detail-panel) .newsx-reply[style*="--trunk-top"]::after');
        expect(bare).toContain('--trunk-top');
        expect(bare).toContain('.newsx-reply-children > .newsx-reply::before');
        expect(bare).toContain('.newsx-reply.is-reply');
        expect(bare).toContain('#portal-news-root .newsx-textarea');
        expect(bare).toContain('min-height: 116px');
        expect(bare).toContain('textarea.newsx-textarea[data-news-reply-input]');
        expect(bare).toContain('min-height: 32px');
        expect(bare).toContain('max-height: 64px');
        expect(bare).not.toContain('#newsx-attachment-viewer-panel .newsx-textarea {\n  min-height: 56px');
        expect(bare).not.toMatch(/:is\(#portal-news-root, #newsx-attachment-viewer-panel(?:, #newsx-post-detail-panel)?\) \.newsx-textarea\s*\{[^}]*min-height:\s*116px/);
    });

    it('switches public and private comments via tabs with shared button chrome', () => {
        const replies = readSource('assets/js/pages/news/news-replies.js');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');
        const publisher = readSource('assets/js/pages/news/news-publisher.js');
        const events = readSource('assets/js/pages/news/news-events.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const feed = readSource('assets/js/pages/news/news-feed-render.js');
        const html = readSource('news.html');
        expect(replies).toContain('newsx-reply-tabs');
        expect(replies).toContain('data-news-reply-tab');
        expect(replies).toContain('data-news-reply-tab-channel="public"');
        expect(replies).toContain('data-news-reply-tab-channel="private"');
        expect(replies).toContain('newsx-reply-tab home-hover-chip');
        expect(replies).toContain('newsx-reply-tab-panel');
        expect(replies).toContain('Post private comment');
        expect(replies).toContain('Write a private comment...');
        expect(replies).toContain('Only you and staff can see private comments here.');
        expect(replies).not.toContain('newsx-reply-fold');
        expect(replies).not.toContain('newsx-private-fold"');
        expect(replies).not.toContain('Public chat');
        expect(replies).not.toContain('Send Private Reply');
        expect(replies).toContain('renderReplyChannelPanel(post, active)');
        expect(replies).toContain('newsReplyActiveTab');
        expect(runtime).toContain('newsReplyActiveTab');
        expect(runtime).toContain("replyMode: 'both'");
        expect(runtime).toContain('Public + private comments');
        expect(publisher).toContain('Public + private comments');
        expect(publisher).toContain('value="both"');
        expect(publisher).not.toContain('Private comments only');
        expect(publisher).not.toContain('Public comments only');
        expect(events).toContain('function refreshNewsReplyShells');
        expect(events).toContain('setNewsReplyActiveTab');
        expect(events).toContain('toggleNewsReplyTarget');
        expect(events).toContain('refreshNewsReplyShells(postId');
        expect(events).toContain("refreshNewsReplyShells(key, { focus: 'active-tab' })");
        expect(events).toContain('data-news-reply-shell');
        expect(events).toContain('preventScroll: true');
        expect(events).toContain("delete runtime.renderCache['post-detail']");
        expect(events).not.toContain('renderNewsPostDetailPanel()');
        expect(events).not.toMatch(/toggleNewsReplyTarget[\s\S]*renderNewsPostRegions\(host/);
        expect(bare).toContain(':is(#portal-news-root, #newsx-attachment-viewer-panel, #newsx-post-detail-panel) .newsx-reply-shell');
        expect(bare).toContain(':is(#portal-news-root, #newsx-attachment-viewer-panel, #newsx-post-detail-panel) .newsx-reply-tabs');
        expect(bare).not.toMatch(/\.newsx-reply-shell\s*\{[^}]*grid-template-columns:\s*repeat\(2/);
        expect(replies).toContain('lux-secondary-btn home-hover-chip newsx-reply-reply-btn');
        expect(replies).toContain('lux-primary-btn home-hover-chip');
        expect(feed).not.toContain('openState.public = true');
        expect(feed).not.toContain('openState.private = true');
        expect(feed).toContain('newsx-btn lux-secondary-btn home-hover-chip" data-news-close-post-detail');
        expect(modals).toContain('#newsx-post-detail-panel *');
        expect(modals).toContain('#newsx-attachment-viewer-panel *');
        expect(html).toContain('lux-page-bare-lite.css?v=20260820-newsfullscreen1');
        expect(html).toContain('lux-modals.css?v=20260820-newssectionsfix1');
        expect(html).toContain('news-feed-render.js?v=20260806-newssectioncollapse1');
        expect(html).toContain('news-replies.js?v=20260731-newsreplytab1');
        expect(html).toContain('news-runtime.js?v=20260806-newssectioncollapse1');
        expect(html).toContain('news-publisher.js?v=20260806-category-select1');
        expect(html).toContain('news-api.js?v=20260731-newsreplytab1');
        expect(html).toContain('news-events.js?v=20260806-newssectioncollapse1');
        expect(feed).toContain("runtime.overlayRefreshMode === 'replies'");
        expect(feed).toContain('refreshNewsReplyShells(replyPostId)');
        expect(feed).toContain('renderNewsPostDetailPanel()');
        expect(feed).toContain('const scrollTop = scrollEl ? scrollEl.scrollTop : null');
        expect(events).toContain("runtime.overlayRefreshMode = 'replies'");
        expect(runtime).toContain("overlayRefreshMode: ''");
    });
});
