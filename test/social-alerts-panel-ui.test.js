import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-alerts-panel-ui.test', () => {
    it('alerts category filters use shared lux-tab primitives', () => {
        const alerts = readSource('assets/js/pages/social-alerts.js');

        expect(alerts).toContain('lux-tab-strip lux-tab-strip--segmented sn-alerts-category-filters');
        expect(alerts).toContain('lux-tab-btn lux-tab-btn--icon');
        expect(alerts).not.toMatch(/renderPillBar[\s\S]*?social-neo-tab/);
    });

    it('alerts header and card actions use lux button classes', () => {
        const alerts = readSource('assets/js/pages/social-alerts.js');

        expect(alerts).toContain('lux-secondary-btn lux-secondary-btn-sm sn-alerts-clear-visible');
        expect(alerts).toContain('lux-secondary-btn lux-secondary-btn-sm sn-alerts-mark-read');
        expect(alerts).toContain('lux-secondary-btn sn-alerts-mod-toggle');
        expect(alerts).toContain('lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="notification-open-chat"');
        expect(alerts).toContain('lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="notification-mark-read"');
        expect(alerts).toContain('lux-ghost-btn lux-secondary-btn-icon sn-alert-card-dismiss');
    });

    it('workspace nav buttons use lux-secondary-btn', () => {
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');

        expect(shell).toContain('lux-secondary-btn social-neo-side-link social-neo-workspace-nav-btn');
        expect(shell).toContain('lux-secondary-btn lux-secondary-btn-sm social-neo-workspace-rail-reveal');
    });

    it('bare-lite includes alerts filter grid and card paint', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-tab-btn--icon');
        expect(bare).toContain('.sn-alerts-header__title');
        expect(bare).toContain('.sn-alerts-header__subtitle');
        expect(bare).toContain('.sn-alerts-category-filters.lux-tab-strip--segmented');
        expect(bare).toMatch(/grid-template-columns:\s*repeat\(6/);
        expect(bare).toContain('.sn-alert-card::before');
        expect(bare).toContain('button.social-neo-workspace-nav-btn.lux-secondary-btn');
    });

    it('messages inbox filters use shared lux-tab-strip', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(messages).toContain('lux-tab-strip lux-tab-strip--segmented social-neo-messages__inbox-filters');
        expect(messages).toContain('class="lux-tab-btn');
        expect(bare).not.toMatch(/social-neo-messages__inbox-filters \.social-neo-tab/);
    });
});
