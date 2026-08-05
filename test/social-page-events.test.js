import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { readSocialPageChain, readSocialPageJs, readSocialHtml, readSocialPageSource } from './helpers/social-page-source.js';

function loadPageEvents() {
    const runtime = { ui: { socialDialog: null, workspaceNavOpen: false, shellDrawerOpen: false } };
    const sandbox = {
        window: {},
        document: {
            activeElement: null,
            querySelectorAll: () => [],
            getElementById: () => null
        },
        String,
        Boolean,
        Promise,
        console
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-page-events.js'), 'utf8'),
        sandbox
    );
    const calls = [];
    const api = sandbox.window.createKiuSocialPageEventsApi({
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => runtime,
        root: () => ({
            querySelector: () => null
        }),
        socialInteractionContains: () => true,
        routeSocialDomain: (value, routes, opts) => {
            calls.push({ value, routes, opts });
            return { matched: false };
        },
        handleShellNavClick: (action) => {
            if (action === 'panel-feed') return { handled: true, result: 'shell-feed' };
            return { handled: false };
        },
        clickDomainRoutes: [{ handle: 'handleSocialFeedClick' }],
        syncCommentDraftFromTarget: () => { calls.push('draft'); },
        rippleSurveySubmitButton: () => {},
        rippleSurveyChoiceLabel: () => {},
        closeDialog: () => { calls.push('close'); },
        closeSocialWorkspaceNavAnimated: () => {},
        renderSocialPageNow: (reason) => { calls.push(reason); },
        applyPhotographyUploadFile: () => {},
        hasSocialFeedModule: () => true,
        ensureSocialFeedModule: () => Promise.resolve(),
        hasSocialWorkspaceModule: () => false,
        ensureSocialWorkspaceModule: () => Promise.resolve(),
        hasSocialGroupsModule: () => false,
        ensureSocialGroupsModule: () => Promise.resolve(),
        hasSocialPagesModule: () => false,
        ensureSocialPagesModule: () => Promise.resolve(),
        hasSocialEventsModule: () => false,
        ensureSocialEventsModule: () => Promise.resolve(),
        hasSocialSurveysModule: () => false,
        ensureSocialSurveysModule: () => Promise.resolve(),
        hasSocialPhotographyModule: () => false,
        ensureSocialPhotographyModule: () => Promise.resolve(),
        hasSocialLostFoundModule: () => false,
        ensureSocialLostFoundModule: () => Promise.resolve(),
        hasSocialMessagesModule: () => false,
        ensureSocialMessagesModule: () => Promise.resolve(),
        hasSocialProfileModule: () => false,
        ensureSocialProfileModule: () => Promise.resolve(),
        hasSocialAlertsModule: () => false,
        ensureSocialAlertsModule: () => Promise.resolve(),
        hasSocialCommunityModule: () => false,
        ensureSocialCommunityModule: () => Promise.resolve()
    });
    return { api, runtime, calls, sandbox };
}

describe('social-page-events', () => {
    let api;
    let runtime;
    let calls;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, calls, sandbox } = loadPageEvents());
    });

    it('installs factory and peels handlers from social-page', () => {
        expect(sandbox.window.__KIU_SOCIAL_PAGE_EVENTS_LOADED).toBe(true);
        expect(typeof api.handleClick).toBe('function');
        expect(typeof api.handleSubmit).toBe('function');
        expect(typeof api.handleInput).toBe('function');
        expect(typeof api.handleChange).toBe('function');

        const page = readSocialPageJs();
        const chain = readSocialPageSource();
        const html = readSocialHtml();
        expect(page).not.toMatch(/async\s+function\s+handleClick\s*\(/);
        expect(page).not.toMatch(/async\s+function\s+handleSubmit\s*\(/);
        expect(page).not.toMatch(/function\s+handleInput\s*\(/);
        expect(page).not.toMatch(/function\s+handleChange\s*\(/);
        expect(chain).toContain('createKiuSocialPageEventsApi');
        expect(html).toContain('social-page-events.js');
        expect(html).toContain('social-page-events.js?v=20260804-pagesize1');
        expect(html.indexOf('social-shell-nav.js')).toBeLessThan(html.indexOf('social-page-events.js'));
        expect(html.indexOf('social-page-events.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('routes shell-nav clicks before domain routes', async () => {
        const trigger = {
            matches: () => false,
            classList: { contains: () => false },
            closest: () => null,
            getAttribute: (name) => (name === 'data-action' ? 'panel-feed' : '')
        };
        const event = {
            target: {
                closest: (sel) => (sel === '[data-action]' ? trigger : null)
            },
            preventDefault() {}
        };
        const result = await api.handleClick(event);
        expect(result).toBe('shell-feed');
        expect(calls.some((c) => c.value === 'panel-feed')).toBe(false);
        expect(event.__kiuSocialHandled).toBe(true);
    });

    it('builds submit domain routes including feed compose', async () => {
        const form = {
            getAttribute: (name) => (name === 'data-form' ? 'post-compose' : ''),
            closest: () => form
        };
        const event = {
            target: form,
            preventDefault() {}
        };
        await api.handleSubmit(event);
        expect(calls.some((c) => c && c.value === 'post-compose')).toBe(true);
        const routeCall = calls.find((c) => c && c.value === 'post-compose');
        expect(routeCall.routes.some((r) => r.handle === 'handleSocialFeedSubmit')).toBe(true);
    });

    it('closes dialog on Escape', () => {
        runtime.ui.socialDialog = { type: 'comments' };
        const event = { key: 'Escape', preventDefault() { calls.push('prevent'); } };
        api.handleGlobalKeydown(event);
        expect(calls).toContain('close');
        expect(calls).toContain('prevent');
    });
});
