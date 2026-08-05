import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readSocialPageChain, readSocialPageJs, readSocialHtml, readSocialPageSource } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social render coordination regressions', () => {
    it('invalidates markup cache and forces center repaint after panel mutations', () => {
        const chain = readSocialPageChain();
        const pageJs = readSocialPageJs();
        const contentRuntime = readSource('assets/js/shared/social-lite-content-runtime.js');
        const inviteRuntime = readSource('assets/js/shared/social-lite-invite-runtime.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const html = readSocialHtml();
        const app = readSource('assets/js/app/app.js');

        expect(chain).toContain('function invalidateSocialRenderCache({ center = true } = {})');
        expect(pageJs).not.toContain('function renderRail(');
        expect(pageJs).not.toContain('social-neo-rail-region');
        expect(chain).toContain('const buildDirectoryFingerprint = window.buildDirectoryFingerprint');
        expect(chain).toContain('const buildReportsFingerprint = window.buildReportsFingerprint');
        expect(readSource('assets/js/pages/social-fingerprint-model.js')).toContain('function buildDirectoryFingerprint(runtime)');
        expect(readSource('assets/js/pages/social-fingerprint-model.js')).toContain('function buildReportsFingerprint(runtime)');
        expect(readSource('assets/js/pages/social-page-boot-runtime.js')).toContain('window.__kiuSocialPatchEventRsvp = patchEventRsvpButtons');
        expect(readSource('assets/js/pages/social-render-plan.js')).toMatch(/reason === 'mobile-nav'/);
        expect((chain + readSource('assets/js/pages/social-events.js'))).toContain("'event-created'");
        expect((chain + readSource('assets/js/pages/social-groups.js'))).toContain("'group-membership'");

        const panelHandlers = [
            ['panel-feed', "renderSocialPageNow('panel-feed')"],
            ['panel-community', "renderSocialPageNow('panel-community')"],
            ['panel-events', "renderSocialPageNow('panel-events')"],
            ['panel-pages', "renderSocialPageNow('panel-pages')"],
            ['panel-groups', "renderSocialPageNow('panel-groups')"],
            ['panel-workspace', "renderSocialPageNow('panel-workspace')"],
            ['panel-projects', "renderSocialPageNow('panel-projects')"],
            ['panel-profile', "renderSocialPageNow('panel-profile')"],
            ['panel-alerts', "renderSocialPageNow('panel-alerts')"],
            ['panel-surveys', "renderSocialPageNow('panel-surveys')"],
            ['panel-messages', "renderSocialPageNow('panel-messages')"]
        ];
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');
        panelHandlers.forEach(([action, renderCall]) => {
            expect(shellNav).toMatch(new RegExp(`action === '${action}'[\\s\\S]*${renderCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        });
        expect(readSocialPageSource()).toContain('handleShellNavClick');
        expect(html).toMatch(/assets\/js\/pages\/social-shell-nav\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-overlay-chrome\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-page-events\.js\?v=/);
        expect(chain).toContain('createKiuSocialPageEventsApi');
        expect(pageJs).toContain('createKiuSocialOverlayChromeApi');
        expect((chain + readSource('assets/js/pages/social-groups.js'))).toMatch(/action === 'group-join'[\s\S]*renderSocialPageNow\('group-membership'\)/);
        expect((chain + readSource('assets/js/pages/social-events.js'))).toMatch(/formType === 'dialog-event-delete'[\s\S]*renderSocialPageNow\('event-deleted'\)/);
        expect((chain + readSource('assets/js/pages/social-feed.js'))).toMatch(/formType === 'dialog-post-delete'[\s\S]*renderSocialPageNow\('post-deleted'\)/);
        expect((chain + readSource('assets/js/pages/social-alerts.js'))).toMatch(/action === 'report-resolve'[\s\S]*renderSocialPageNow\('report-resolve'\)/);

        expect(runtime).toContain('invalidatePortalSocialRenderCache: invalidateSocialRenderCache');
        expect(contentRuntime).toMatch(/setFlash\('Event created\.'[\s\S]*skipRender: true/);
        expect(inviteRuntime).toMatch(/setFlash\('Event deleted\.'[\s\S]*skipRender: true/);
        expect(contentRuntime).toMatch(/setFlash\('Post deleted\.'[\s\S]*skipRender: true/);
        expect(inviteRuntime).toContain("queueRender('event-deleted')");

        expect(html).toMatch(/assets\/js\/pages\/social-ui-kernel\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-page\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-dialog-router\.js\?v=/);
        expect(html).toMatch(/assets\/js\/shared\/social-runtime-lite\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-mobile\.js\?v=/);
        expect(app).toMatch(/assets\/js\/pages\/social-page\.js\?v=/);
        expect(app).toMatch(/assets\/js\/shared\/social-runtime-lite\.js\?v=/);
        expect(app).toMatch(/assets\/js\/pages\/social-mobile\.js\?v=/);
    });

    it('does not keep duplicate RSVP patch helpers', () => {
        const pageJs = readSocialPageJs();
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');
        expect(pageJs.match(/function patchEventRsvpButtons\(/g) || []).toHaveLength(0);
        expect(interactions.match(/function patchEventRsvpButtons\(/g) || []).toHaveLength(1);
        expect(boot).toContain('window.__kiuSocialPatchEventRsvp = patchEventRsvpButtons');
    });
});
