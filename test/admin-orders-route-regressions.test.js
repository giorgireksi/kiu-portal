const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('admin orders route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('admin-orders.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-modals.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-orders-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(bare).toContain('#admin-orders-root');
        expect(bare).toContain('.orders-admin-command-layout');
        expect(readSource('assets/css/lux-modals.css')).toContain('.admin-orders-create-modal');
        expect(readSource('admin-orders.html')).toContain('data-lux-layout-only="1"');
        expect(readSource('assets/js/shared/orders-workspace.js')).toMatch(/orders-admin-panel[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/shared/orders-workspace.js')).toContain('ensureAdminOrdersModals');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('loads orders and portal persist runtimes in dependency order', () => {
        const html = readSource('admin-orders.html');

        expect(html).toContain('orders-runtime-core.js');
        expect(html).toContain('orders-inbox.js');
        expect(html).toContain('api-portal-persist-runtime.js');
        expect(html.indexOf('orders-runtime-core.js')).toBeLessThan(html.indexOf('orders-inbox.js'));
        expect(html.indexOf('orders-inbox.js')).toBeLessThan(html.indexOf('orders-workspace.js'));
        expect(html.indexOf('api-portal-persist-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/api.js'));
    });

    it('applies shared paint SSOT for admin orders workspace surfaces', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const controls = readSource('assets/css/lux-controls.css');
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const workspace = readSource('assets/js/shared/orders-workspace.js');

        expect(controls).toMatch(/\.lux-status-pill\s*\{/);
        expect(bare).toContain('.admin-orders-create-modal');
        expect(bare).toContain('.orders-admin-filter-grid :is(.lux-control, .lux-picker-btn--compact)');
        expect(bare).not.toContain('.orders-admin-filter-grid .lux-picker-field .lux-picker-btn');
        expect(bare).not.toContain('#admin-orders-root [data-lux-glass-root="1"]');
        expect(bare).toContain('.admin-orders-thread-modal');
        expect(modals).toContain('.admin-orders-create-modal .orders-recipient-row');
        expect(fouc).toContain('[data-lux-glass-root="1"] .lux-status-pill');
        expect(controls).toContain('#admin-orders-root');
        expect(controls).toContain('.lux-status-pill.is-info');
        expect(workspace).toContain('lux-card-title orders-admin-section-title');
        expect(workspace).toContain('lux-panel-copy orders-admin-section-copy');
        expect(workspace).toContain('lux-empty-state lux-panel-copy orders-admin-sent-empty');
        expect(readSource('assets/css/lux-layout-primitives.css')).toContain('.orders-admin-section-title.lux-card-title');
        expect(fouc).toContain('.orders-admin-sent-item');
        expect(fouc).toContain('.orders-admin-sent-empty');
        expect(workspace).toContain('lux-picker-field orders-admin-filter-field');
        expect(workspace).toContain('admin-orders-create-modal modal-content" data-lux-transparency-exempt="1"');
        expect(workspace).not.toContain('data-lux-btn-density="dense"');
        expect(workspace).not.toContain('admin-orders-create-modal modal-content lux-panel');
        expect(workspace).toContain('admin-orders-thread-chat-log lux-scrollbar home-hover-chip');
        expect(workspace).toContain('admin-orders-thread-msg-bubble home-hover-chip');
        expect(workspace).toContain('admin-orders-thread-composer home-hover-chip');
        expect(workspace).toContain('admin-orders-thread-attachment home-hover-chip');
        expect(modals).toContain('[data-lux-transparency-exempt="1"] .admin-orders-thread-modal :is(');
        expect(modals).toContain('.admin-orders-thread-header');
        expect(fouc).toContain('.admin-orders-thread-chat-log.home-hover-chip:has(.home-hover-chip)');
    });

    it('uses fullscreen admin-orders modals without transparency flicker on open', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const workspace = readSource('assets/js/shared/orders-workspace.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        expect(modals).toContain('.admin-orders-modal-overlay.modal-overlay');
        expect(modals).toContain('padding: 0');
        expect(modals).toContain('max-width: none');
        expect(modals).toContain('max-height: 100dvh');
        expect(modals).toContain(':not(.admin-orders-create-modal):not(.admin-orders-thread-modal)');
        expect(workspace).toContain('function renderAdminOrdersCreateModalContents()');
        expect(workspace).toMatch(/openAdminOrdersCreateModal\(\)[\s\S]*renderAdminOrdersCreateModalContents\(\)/);
        expect(workspace).not.toMatch(/function setAdminOrdersCreateModalOpen\([\s\S]*?queueLuxuryTransparencyRefresh/);
        expect(transparency).toContain('#admin-orders-create-overlay');
        expect(transparency).toContain('#admin-orders-thread-overlay');
    });

    it('keeps admin-orders modal fields layout-only and restores moving-shell CTAs', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const ordersHtml = readSource('orders.html');

        expect(bare).toContain('.admin-orders-create-modal');
        expect(bare).toContain(':is(.lux-control, .lux-picker-btn--compact)');
        expect(bare).not.toMatch(
            /\.admin-orders-create-modal[\s\S]*?\.lux-picker-btn[\s\S]*?box-shadow:\s*none/
        );
        expect(modals).toContain('.orders-recipient-action-row *');
        expect(modals).toContain('#admin-orders-root .orders-admin-command-actions *');
        expect(modals).toContain('Admin orders modal fields — layout only');
        expect(ordersHtml).toContain('lux-modals.css');
        expect(transparency).toContain('.lux-card-head, .lux-card-title, .lux-card-copy, .lux-control');
    });
});
