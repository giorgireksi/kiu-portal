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
        expect(html).toContain('lux-layout-primitives.css');
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
        expect(html).toContain('utilities.js');
        expect(html.indexOf('utilities.js')).toBeLessThan(html.indexOf('orders-inbox.js'));
        expect(html.indexOf('orders-runtime-core.js')).toBeLessThan(html.indexOf('orders-inbox.js'));
        expect(html.indexOf('orders-inbox.js')).toBeLessThan(html.indexOf('orders-workspace.js'));
        expect(html.indexOf('api-portal-persist-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/api.js'));
    });

    it('skips orders-inbox auto-boot on the admin-orders route', () => {
        const inbox = readSource('assets/js/shared/orders-inbox.js');
        const autoBoot = inbox.split('function shouldAutoBootOrdersInboxOnScriptLoad(')[1]?.split('\nfunction ')[0]
            || inbox.split('function shouldAutoBootOrdersInboxOnScriptLoad(')[1]?.split('\nif (')[0]
            || '';
        expect(autoBoot).toContain("classList.contains('lux-route-orders')");
        expect(autoBoot).toContain("classList.contains('lux-route-admin-orders')");
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
        expect(bare).toContain('.orders-inbox-layout-filters :is(.lux-control, .lux-picker-btn--compact)');
        expect(bare).not.toContain('.orders-admin-filter-grid .lux-picker-field .lux-picker-btn');
        expect(bare).not.toContain('#admin-orders-root [data-lux-glass-root="1"]');
        expect(bare).toContain('.admin-orders-thread-modal');
        expect(modals).toContain('.admin-orders-create-modal .orders-recipient-row');
        expect(fouc).toContain('.lux-status-pill.home-hover-chip');
        expect(controls).toContain('#admin-orders-root');
        expect(controls).toContain('.lux-status-pill.is-info');
        expect(bare).toContain('body:is(.lux-route-admin-orders, .lux-entry-admin-orders) #admin-orders-root .orders-inbox-layout-filters');
        expect(bare).toContain('#admin-orders-root .orders-inbox-layout-filters');
        expect(bare).toContain('.orders-admin-audience-search');
        expect(fouc).toContain('body:is(.lux-route-admin-orders, .lux-entry-admin-orders) #admin-orders-root');
        expect(fouc).toContain('.orders-inbox-shell[data-lux-glass-root');
        expect(fouc).not.toContain('.orders-admin-sent-status-row .orders-status-filter');
        expect(fouc).not.toMatch(/#admin-orders-root[\s\S]{0,240}\.orders-admin-audience-tab[\s\S]{0,200}lux-soft-chrome-surface/);
        expect(workspace).toContain('lux-tab-btn orders-admin-audience-tab');
        expect(workspace).not.toContain('lux-tab-btn orders-status-filter');
        expect(workspace).not.toContain('data-admin-orders-sent-status');
        expect(workspace).toContain('data-lux-skip-modern-button="true"');
        expect(workspace).toContain('lux-tab-strip lux-tab-strip--segmented orders-admin-audience-tabs');
        expect(workspace).toContain('lux-tab-badge');
        expect(workspace).not.toContain('orders-admin-audience-tab__badge');
        expect(workspace).not.toContain('orders-admin-audience-tab lux-filter-pill home-hover-chip');
        expect(workspace).not.toContain('orders-status-filter lux-filter-pill home-hover-chip');
        expect(workspace).not.toContain('orders-admin-sent-status-row');
        expect(bare).toContain('.orders-status-row:not(.lux-tab-strip)');
        expect(bare).toContain('.orders-status-row.lux-tab-strip');
        expect(bare).toContain('Reassert lux-controls segmented strip recipe');
        expect(bare).toContain('.orders-admin-audience-tabs.lux-tab-strip--segmented');
        expect(bare).toContain('.orders-status-row.lux-tab-strip--segmented');
        expect(bare).toContain('.orders-admin-sent-status-row.lux-tab-strip--segmented');
        expect(bare).toMatch(/gap:\s*3px/);
        expect(bare).toContain('var(--lux-panel-control, var(--lux-panel-fill))');
        expect(readSource('assets/js/features/luxury-index-runtime.js')).toContain('!/\\blux-tab-btn\\b/i.test(className)');
        expect(readSource('assets/js/features/luxury-index-runtime.js')).toContain('(?:tab|reg-tab|pv-tab|nav-item)');
        expect(workspace).toContain('lux-card-title orders-admin-section-title');
        expect(workspace).toContain('lux-panel-copy orders-admin-section-copy');
        expect(workspace).toContain('lux-empty-state lux-panel-copy orders-admin-sent-empty');
        expect(workspace).toContain('orders-admin-filter-strip');
        expect(workspace).not.toContain('orders-admin-audience-filter-head');
        expect(workspace).not.toContain('Dispatch institutional orders');
        expect(workspace).toContain("Items · ${escapeHtml(getOrdersRecipientFilterEditorRoleLabel(getAdminAudienceRole()))}");
        expect(bare).toContain('.orders-admin-filter-strip');
        expect(bare).toMatch(/\.orders-admin-panel__body--workspace\s*\{[\s\S]*?padding:\s*14px 16px 16px/);
        expect(bare).toMatch(/\.orders-admin-workspace-divider\s*\{[\s\S]*?margin:\s*10px 0/);
        expect(readSource('assets/css/lux-layout-primitives.css')).toContain('.orders-admin-section-title.lux-card-title');
        expect(fouc).toContain('.orders-admin-sent-item');
        expect(fouc).toContain('.orders-admin-workspace-section.lux-soft-chrome');
        expect(fouc).toContain('.orders-admin-sent-empty');
        expect(workspace).toContain('orders-admin-workspace-section--command lux-soft-chrome home-hover-chip');
        expect(workspace).toContain('orders-admin-workspace-section--filter lux-soft-chrome home-hover-chip');
        expect(workspace).toContain('orders-admin-workspace-section--inbox lux-soft-chrome home-hover-chip');
        expect(workspace).toContain('lux-primary-btn orders-admin-command-cta home-hover-chip');
        expect(workspace).toContain('orders-admin-sent-item lux-soft-chrome home-hover-chip');
        expect(workspace).toContain('lux-secondary-btn home-hover-chip" data-admin-orders-edit-recipient-filters');
        expect(workspace).toContain('orders-recipient-row lux-soft-chrome home-hover-chip');
        expect(fouc).toMatch(
            /#admin-orders-create-overlay[\s\S]*?\.orders-recipient-row\.home-hover-chip[\s\S]*?contain:\s*none/
        );
        expect(bare).toMatch(
            /\.orders-recipient-list-scroll[\s\S]*?align-content:\s*start[\s\S]*?grid-auto-rows:\s*max-content/
        );
        expect(bare).toContain('.orders-admin-workspace-section.lux-soft-chrome.home-hover-chip');
        expect(bare).not.toMatch(/\.orders-admin-sent-item:hover[\s\S]{0,120}lux-soft-chrome-chip-shadow/);
        expect(workspace).toContain('orders-inbox-layout-filters');
        expect(workspace).toContain('lux-picker-field orders-inbox-layout-filter');
        expect(workspace).not.toContain('orders-admin-filter-grid--layout');
        expect(workspace).toContain('data-admin-orders-audience-role');
        expect(workspace).toContain('countAdminAudienceNotifications');
        expect(workspace).not.toContain("data-admin-orders-sent-filter=\"type\"");
        expect(workspace).not.toContain("data-admin-orders-sent-filter=\"kind\"");
        expect(workspace).not.toContain("data-admin-orders-sent-filter=\"recipientRole\"");
        expect(bare).toContain('.orders-admin-audience-tabs');
        expect(workspace).toContain('admin-orders-create-modal modal-content" data-lux-transparency-exempt="1"');
        expect(workspace).not.toContain('data-lux-btn-density="dense"');
        expect(workspace).not.toContain('admin-orders-create-modal modal-content lux-panel');
        expect(workspace).toContain('admin-orders-thread-body modal-body lux-scrollbar');
        expect(workspace).toContain('data-admin-order-detail-body');
        expect(workspace).toContain('renderOrderDetailDescriptionMarkup');
        expect(workspace).toContain('renderOrderDetailAttachmentsMarkup');
        expect(workspace).toContain('aria-label="Order details"');
        expect(workspace).not.toContain('admin-orders-thread-chat-log');
        expect(workspace).not.toContain('admin-orders-thread-composer');
        expect(workspace).not.toContain('data-admin-order-thread-remove-open');
        expect(workspace).not.toContain('confirmThreadReplyDelete');
        expect(workspace).not.toContain('function sendAdminOrderThreadReply');
        expect(modals).toContain('.admin-orders-thread-header');
        expect(modals).toContain('.admin-orders-thread-body');
        expect(modals).toContain('.admin-orders-thread-modal > #admin-orders-thread-panel');
        expect(modals).not.toContain('.admin-orders-thread-composer');
        expect(modals).not.toContain('#admin-orders-thread-remove-overlay');
        expect(modals).not.toContain('.admin-orders-thread-msg-bubble');
        expect(workspace).toContain('document.body.appendChild(createOverlay)');
        expect(workspace).toContain('document.body.appendChild(threadOverlay)');
        expect(workspace).toContain('staleRemoveOverlay.remove()');
        expect(fouc).not.toContain('.admin-orders-thread-chat-log.home-hover-chip:has(.home-hover-chip)');
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
            /\.admin-orders-create-modal[^\n]{0,160}\.lux-picker-btn[^\n]{0,240}box-shadow:\s*none/
        );
        expect(modals).toContain('.orders-recipient-action-row *');
        expect(modals).toContain('#admin-orders-root .orders-admin-command-actions *');
        expect(modals).toContain('Admin orders modal fields — layout only');
        expect(ordersHtml).toContain('lux-modals.css');
        expect(transparency).toContain('.lux-card-head, .lux-card-title, .lux-card-copy, .lux-control');
    });
});
