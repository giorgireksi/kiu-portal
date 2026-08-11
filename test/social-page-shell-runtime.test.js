import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-shell-runtime peel', () => {
    it('owns shell/messages/groups helpers outside social-page.js via factory', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        expect(main).toContain('__kiuCreateSocialPageShellApi');
        expect(main).not.toMatch(/^\s*function renderShellWorkspaceNav\b/m);
        expect(main).not.toMatch(/^\s*function ensureSocialShell\b/m);
        expect(main).not.toMatch(/^\s*function isSocialMessagesPanel\b/m);
        expect(main).not.toMatch(/^\s*function normalizeGroupLeaveToken\b/m);
        expect(shell).toContain('function renderShellWorkspaceNav');
        expect(shell).toContain('function ensureSocialShell');
        expect(shell).toContain('function isSocialMessagesPanel');
        expect(shell).toContain('function normalizeGroupLeaveToken');
        expect(shell).toContain('__kiuCreateSocialPageShellApi');
        expect(shell).toContain('__KIU_SOCIAL_PAGE_SHELL_LOADED');
    });

    it('loads before social-page.js on social.html', () => {
        const html = readSource('social.html');
        expect(html).toContain('social-page-shell-runtime.js');
        expect(html.indexOf('social-page-shell-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
        expect(html).toContain('social-page-shell-runtime.js?v=20260810-socialbootveil2');
    });

    it('does not clear overlay lock artifacts inside syncSocialScrollLayout', () => {
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        const layoutFn = shell.match(/function syncSocialScrollLayout\([\s\S]*?\n        function migrateSocialScrollOnLockChange/);
        expect(layoutFn?.[0] || '').not.toContain('clearSocialOverlayLockArtifacts');
        expect(shell).not.toMatch(/const clearSocialOverlayLockArtifacts = __dep/);
    });
});
