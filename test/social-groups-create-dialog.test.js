import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social groups create dialog regressions', () => {
    it('opens group creation in the overlay dialog instead of a broken inline tab switch', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        const groupsModule = readSource('assets/js/pages/social-groups.js');
        expect((source + groupsModule)).toContain("if (action === 'group-create-open')");
        expect((source + groupsModule)).toContain("openDialog('group-create')");
        expect(readSource('assets/js/pages/social-groups.js')).toContain("if (kind === 'group-create')");
        expect(source).toContain('function renderGroupCreateDialog(');
        expect(groupsModule).toContain('function renderGroupCreateDialog(');
        expect(groupsModule).toContain('data-form="create-group"');
        expect(groupsModule).toContain('data-action="group-create-open"');
        expect(source).not.toContain('data-action="panel-groups" data-groups-tab="create"');
        expect(groupsModule).not.toContain('data-action="panel-groups" data-groups-tab="create"');

        const panelGroupsBlock = source.match(/if \(action === 'panel-groups'\) \{[\s\S]*?\n        \}/)?.[0] || '';
        expect(panelGroupsBlock).toContain("if (tab) return renderSocialPageNow('groups-tab')");

        expect(source).toContain('closeDialog();');
        expect((source + readSource('assets/js/pages/social-groups.js'))).toMatch(/if \(formType === 'create-group'\)[\s\S]*?closeDialog\(\)/);

        expect(css).toContain('.social-neo-dialog-card--group-create');
        expect(css).toContain('.social-neo-dialog-group-create-section');
        expect(css).toContain('.social-neo-dialog-hint');
        expect(css).toContain('.social-neo-dialog-invite-columns');
        expect(groupsModule).toContain('social-neo-dialog-group-create-section');
        expect(groupsModule).toContain('social-neo-dialog-hint');
        expect(source).toContain('queueGroupInviteSearchRefresh');
        expect(groupsModule).not.toMatch(/renderGroupCreateInviteSection[\s\S]*data-action="group-member-search"/);
        expect(html).toContain('social-neo-overlay-portal');
        expect(html).toContain('social-neo-dialog-region');
    });

    it('keeps invite picker updates inside the open group-create dialog', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('groupCreateDialogReasons');
        expect((source + readSource('assets/js/pages/social-groups.js'))).toContain("'group-member-add'");
        expect((source + readSource('assets/js/pages/social-groups.js'))).toContain("'group-member-remove'");
        expect(source).toMatch(/group-create-open\|group-leave-wizard-next\|group-leave-wizard-prev\|group-member-add\|group-member-remove/);
        expect(source).toContain('ui.groupInviteSelectedIds');
    });

    it('wires group create glass shell into transparency token pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/social-rebuild.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = source.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(css).toMatch(/--social-glass-surface/);
        expect(css).toMatch(/--group-create-surface:\s*var\(--social-glass-surface\)/);
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--social-glass[\s\S]*?backdrop-filter:\s*var\(--social-glass-blur\)/
        );
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--group-create[\s\S]*?social-neo-dialog-invite-list/
        );
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--group-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--group-create'");
        expect(scheduleRefresh).toContain("'group-create'");
        const groupsModule = readSource('assets/js/pages/social-groups.js');
        expect(groupsModule).toContain('social-neo-dialog-card--group-create social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass');
    });

    it('defines light-mode polish for group create glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--social-glass \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightTokens).toContain('--social-glass-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--social-glass-blur: blur(26px) saturate(155%)');
        expect(lightTokens).toContain('--group-create-section: var(--social-glass-section)');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--social-glass\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );

        const glassTokenBlock = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lms-create:is\([\s\S]*?\) \{[\s\S]*?--lms-create-glass-surface/
        )?.[0] || '';
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--group-create');
    });

    it('adds depth polish for light group create shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal \\.social-neo-dialog-card--group-create';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-dialog-group-create-section[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-dialog-invite-list[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--social-glass \.social-neo-dialog-head[\s\S]*?border-bottom: 1px solid rgba\(48, 34, 22, 0\.08\)/
        );
    });
});
