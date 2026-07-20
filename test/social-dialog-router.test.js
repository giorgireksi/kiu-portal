import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadRouter() {
    const sandbox = {
        window: {
            GROUP_OWNED_DIALOG_KINDS: new Set(['group-create']),
            FEED_OWNED_DIALOG_KINDS: new Set(['post-compose']),
            renderFeedOwnedDialog: (runtime, dialog) => `feed:${dialog.type}:${runtime.ok}`,
            renderGroupOwnedDialog: (runtime, dialog) => `group:${dialog.type}`
        },
        Set,
        Array,
        String,
        Boolean,
        Promise: {
            resolve: () => ({ then: (fn) => { fn?.(); return { catch: () => ({}) }; } }),
            then: () => ({ catch: () => ({}) })
        }
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-dialog-router.js'), 'utf8'),
        sandbox
    );
    return sandbox;
}

describe('social-dialog-router', () => {
    let sandbox;
    let dialog;

    beforeEach(() => {
        sandbox = loadRouter();
        dialog = { type: 'post-compose' };
    });

    it('routes owned kinds to loaded modules and peels from page', () => {
        const win = sandbox.window;
        expect(win.__KIU_SOCIAL_DIALOG_ROUTER_LOADED).toBe(true);
        const renderDialog = win.createKiuSocialDialogRenderer({
            text: (v) => String(v == null ? '' : v).trim(),
            state: () => ({ ok: 1 }),
            activeDialog: () => dialog,
            queueDeferredModuleRender: () => {},
            hasSocialPhotographyModule: () => false,
            hasSocialGroupsModule: () => true,
            ensureSocialGroupsModule: () => Promise.resolve(),
            hasSocialPagesModule: () => false,
            ensureSocialPagesModule: () => Promise.resolve(),
            hasSocialFeedModule: () => true,
            ensureSocialFeedModule: () => Promise.resolve(),
            hasSocialEventsModule: () => false,
            ensureSocialEventsModule: () => Promise.resolve(),
            hasSocialMessagesModule: () => false,
            ensureSocialMessagesModule: () => Promise.resolve(),
            hasSocialProfileModule: () => false,
            ensureSocialProfileModule: () => Promise.resolve(),
            hasSocialLostFoundModule: () => false,
            ensureSocialLostFoundModule: () => Promise.resolve(),
            hasSocialSurveysModule: () => false,
            ensureSocialSurveysModule: () => Promise.resolve(),
            hasSocialWorkspaceModule: () => false,
            ensureSocialWorkspaceModule: () => Promise.resolve(),
            renderWorkspaceOwnedDialogStub: () => ''
        });
        expect(renderDialog()).toBe('feed:post-compose:1');
        dialog = { type: 'group-create' };
        expect(renderDialog()).toBe('group:group-create');
        dialog = null;
        expect(renderDialog()).toBe('');

        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        expect(page).not.toMatch(/function\s+renderDialog\s*\(/);
        expect(page).toContain('createKiuSocialDialogRenderer');
        expect(html).toContain('social-dialog-router.js');
        expect(html.indexOf('social-dialog-router.js')).toBeLessThan(html.indexOf('social-page.js'));
    });
});
