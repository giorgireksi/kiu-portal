import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social overlay viewport regressions', () => {
    it('portals dialogs to body and keeps viewport-fixed overlay behavior', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        expect(html).toContain('id="social-neo-overlay-portal"');
        expect(html).toContain('assets/js/pages/social-page.js');
        expect(html).toContain('assets/css/social-rebuild.css');
        const rootStart = html.indexOf('id="social-neo-root"');
        const rootEnd = html.indexOf('</main>', rootStart);
        const rootSection = html.slice(rootStart, rootEnd);
        expect(rootSection).not.toContain('social-neo-dialog-region');

        expect(css).toContain('body.lux-route-social #social-neo-overlay-portal');
        expect(css).toContain('body.lux-route-social.social-overlay-open');
        expect(css).toContain('z-index: 10050');
        expect(css).toContain('max-height: min(90dvh, 900px)');

        expect(source).toContain('function ensureSocialOverlayPortal()');
        expect(source).toContain('function socialInteractionContains(node)');
        expect(source).toContain('function syncOverlayPortalVisibility()');
        expect(source).toContain('const isDialogRender = reason === \'dialog-close\' || /^dialog-/.test(reason)');
        expect(source).toContain('skipWindow: isDialogRender || interactionSnapshot.deferWindowScroll');
        expect(source).toContain("reason === 'dialog-close' || /^dialog-/.test(reason)");
        expect(source).toMatch(/\^\(comment-\|post-react\|post-save\|post-pin/);
        expect(source).toContain('document.body.dataset.socialOverlayLocked');
        expect(source).toContain('function pruneStaleSocialOverlayState()');
        expect(source).toContain('function clearSocialOverlayLockArtifacts()');
        expect(source).toContain('function socialOverlayPortalHasContent()');
        expect(css).toContain('html:has(body.lux-route-social.social-overlay-open)');

        expect(source + readSource('assets/js/pages/social-groups.js') + readSource('assets/js/pages/social-pages.js')).toContain('social-neo-dialog-card--compact');
        expect(source).toContain('social-neo-dialog-body');
        expect(source).toContain('social-neo-dialog-field');
        expect(readSource('assets/js/pages/social-groups.js')).toContain('name="inviteGroupId"');
        expect(readSource('assets/js/pages/social-groups.js')).not.toContain('name="inviteGroupId" data-lux-native');

        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(chrome).toContain('function applyLuxPickerPanelVariants(panel, button)');
        expect(chrome).toContain('lux-droplist-panel');
        expect(chrome).toContain('#social-neo-overlay-portal');

        expect(css).toContain('.social-neo-dialog-card--compact');
        expect(css).toContain('.social-neo-dialog-body');
        expect(css).toContain('.social-neo-dialog-picker-panel');
        expect(css).toContain('.social-neo-dialog-backdrop .lux-universal-picker-field');
    });
});