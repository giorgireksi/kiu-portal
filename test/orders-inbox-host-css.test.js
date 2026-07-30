import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('orders inbox host css', () => {
    it('scopes inbox layout selectors to both standard and admin-root hosts', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('Recipient orders inbox hosts (#page-orders, #orders-inbox-root, #admin-orders-root, #admin-orders-thread-overlay)');
        expect(bare).toContain('body:is(.lux-route-admin-orders, .lux-entry-admin-orders) :is(#admin-orders-root, #admin-orders-thread-overlay)');
        expect(bare).toContain('.orders-inbox-shell .lux-card-head');
        expect(bare).toContain('#admin-orders-root .orders-inbox-layout-filters');
        expect(bare).toMatch(/\.orders-list-wrap\s*\{[^}]*overflow:\s*visible/);
        expect(bare).not.toContain('--home-chip-hover-lift-nested: var(--home-chip-hover-lift, -3px)');
        expect(bare).toMatch(/\.orders-list\s*\{[\s\S]*?padding-block:\s*4px/);
        expect(bare).toMatch(/\.orders-list\s*\{[\s\S]*?scroll-padding-block:\s*4px/);
        expect(bare).toContain('Reassert lux-controls segmented strip recipe');
        expect(bare).toContain('.orders-admin-audience-tabs.lux-tab-strip--segmented');
        expect(bare).toContain('.orders-status-row.lux-tab-strip--segmented');
        expect(bare).toContain('var(--lux-panel-control, var(--lux-panel-fill))');
    });

    it('scopes inbox paint selectors behind the inbox shell for both hosts', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body:is(.lux-route-admin-orders, .lux-entry-admin-orders) #admin-orders-root');
        expect(fouc).toContain('body:is(.lux-route-admin-orders, .lux-entry-admin-orders) #admin-orders-thread-overlay');
        expect(fouc).toMatch(
            /body:is\(\.lux-route-admin-orders, \.lux-entry-admin-orders\) #admin-orders-root \.orders-inbox-shell,\s*\n\s*body:is\(\.lux-route-admin-orders, \.lux-entry-admin-orders\) #admin-orders-thread-overlay\s*\n\) :is\(/
        );
        expect(fouc).toContain('.orders-detail-panel.lux-detail-panel');
        expect(fouc).toContain('.orders-metric-card');
        expect(fouc).toContain('.orders-recipient-card');
        expect(fouc).toContain('.orders-inbox-shell .lux-summary-surface');
        expect(fouc).toContain('.orders-inbox-shell .orders-list-wrap');
        expect(fouc).toContain('#admin-orders-root.lux-page-shell');
        expect(fouc).toContain('.orders-inbox-shell[data-lux-glass-root="1"]');
        expect(fouc).toContain('body.lux-unified-shell .orders-inbox-shell[data-lux-glass-root="1"] .orders-inbox-workspace');
        expect(fouc).toContain('.orders-inbox-workspace');
        expect(fouc).not.toContain('body.lux-unified-shell .orders-inbox-shell[data-lux-glass-root="1"] :is(\n  .orders-inbox-hero,');
        expect(fouc).toContain('.orders-list-empty.home-hover-chip');
        expect(fouc).toContain('.orders-detail-empty.home-hover-chip');
        expect(fouc).toContain('.orders-item.home-hover-chip');
        expect(fouc).toContain('body.lux-unified-shell .lux-card:not(.orders-inbox-workspace):hover');
        expect(fouc).toMatch(/\.orders-inbox-shell\[data-lux-glass-root="1"\] \.orders-inbox-workspace\s*\{[\s\S]*?overflow:\s*visible/);
        expect(fouc).toMatch(/\.orders-inbox-shell\[data-lux-glass-root="1"\] \.orders-inbox-workspace\s*\{[\s\S]*?contain:\s*none/);
    });

    it('keeps the runtime host contract unchanged', () => {
        const inbox = readSource('assets/js/shared/orders-inbox.js');
        expect(inbox).toContain('data-orders-inbox-shell="1"');
        expect(inbox).toContain('data-lux-glass-root="1"');
        expect(inbox).toContain("document.getElementById('admin-orders-root')");
        expect(inbox).toContain('orders-inbox-workspace lux-summary-surface');
        expect(inbox).toContain('data-orders-inbox-hero="1"');
        expect(inbox).toContain('orders-inbox-workspace-list');
        expect(inbox).toContain('orders-inbox-workspace-detail');
        expect(inbox).not.toContain('orders-inbox-hero lux-summary-surface');
        expect(inbox).toContain('orders-list-empty home-hover-chip');
        expect(inbox).toContain('orders-detail-empty home-hover-chip');
        expect(inbox).toContain('orders-item lux-select-card home-hover-chip');
    });
});
