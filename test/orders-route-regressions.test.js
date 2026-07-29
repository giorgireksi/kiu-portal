const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('orders route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('orders.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'orders-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('loads shared layout primitives and rorders5 cache', () => {
        const html = readSource('orders.html');
        expect(html).toContain('rorders5');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-fouc-ht.css');
        expect(html).toContain('data-lux-layout-only="1"');
    });

    it('bare-lite orders inbox block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const block = bare.split('/* ── Recipient orders inbox')[1]?.split('/* ── Admin orders workspace')[0] || '';
        expect(block).toContain('.orders-inbox-shell');
        expect(block).toContain('.orders-inbox-grid');
        expect(block).toContain('.orders-list-wrap');
        expect(block).toContain('.orders-item');
        expect(block).toContain('.orders-detail-empty');
        expect(block).not.toMatch(/orders-inbox-hero\s*\{[^}]*background:/);
        expect(block).not.toMatch(/orders-list-card\s*\{[^}]*background:/);
        expect(block).not.toMatch(/orders-detail-card\s*\{[^}]*background:/);
    });

    it('fouc-ht orders inbox block paints matte inners and frosted primary shells', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const block = fouc.split('/* Orders inbox page:')[1]?.split('/* Social comments dialog:')[0] || '';
        const frosted = fouc.split('/* Orders inbox primary shells:')[1]?.split('/* Global luxury hover motion')[0] || '';
        expect(block).toContain('body.lux-route-orders');
        expect(block).toContain('.orders-list-wrap');
        expect(block).toContain('.orders-item');
        expect(block).toContain('.orders-status-filter');
        expect(block).toContain('var(--lux-soft-chrome-chip-shadow, var(--lux-elev-2))');
        const matteList = block.slice(
            block.indexOf('body.lux-route-orders :is(#page-orders, #orders-inbox-root) :is('),
            block.indexOf(') {', block.indexOf('body.lux-route-orders :is(#page-orders, #orders-inbox-root) :is('))
        );
        expect(matteList).not.toMatch(/\.orders-inbox-hero[,)]/);
        expect(matteList).not.toContain('.orders-list-card');
        expect(matteList).not.toContain('.orders-detail-card');
        expect(block).toContain('#page-orders.lux-page-shell');
        expect(block).toContain('.orders-inbox-shell[data-lux-glass-root="1"]');
        expect(block).toContain('.lux-summary-surface:not(.orders-inbox-hero):not(.orders-list-card):not(.orders-detail-card)');
        expect(fouc).toContain('Orders inbox primary shells: frosted panel glass (not matte soft-chrome)');
        expect(frosted).toContain('backdrop-filter: var(--lux-panel-blur-filter) !important');
        expect(block).not.toContain('--home-chip-hover-lift');
        expect(block).toContain('.orders-inbox-hero-side');
        expect(block).toContain('.lux-status-pill.home-hover-chip');
        expect(block).toContain('.orders-item');
        expect(block).toContain('.lux-pill.lux-soft-chrome');
        expect(block).not.toContain(':has(.lux-hero-signal:hover)');
        expect(block).not.toContain(':has(:is(');
        expect(block).toContain('.home-hover-chip');
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).toContain('--lux-panel-blur-filter');
        expect(fouc).toMatch(/body\.lux-unified-shell :is\(\.home-hover-chip, \.lux-card:not\(\.orders-inbox-hero\)/);
        expect(fouc).toMatch(/body\.lux-unified-shell :is\(#page-orders, #orders-inbox-root\)[\s\S]*backdrop-filter: var\(--lux-panel-blur-filter\) !important/);
    });

    it('runtime mounts orders inbox glass host', () => {
        const inbox = readSource('assets/js/shared/orders-inbox.js');
        expect(inbox).toContain('data-orders-inbox-shell="1"');
        expect(inbox).toContain('data-lux-glass-root="1"');
        expect(inbox).toContain('orders-inbox-hero lux-summary-surface');
        expect(inbox).toContain('lux-pill lux-soft-chrome home-hover-chip');
        expect(inbox).toContain('lux-hero-signal home-hover-chip');
        expect(inbox).toContain('class="lux-control"');
    });
});
