import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social render coordination regressions', () => {
    it('invalidates markup cache and forces center repaint after panel mutations', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const html = readSource('social.html');
        const app = readSource('assets/js/app/app.js');

        expect(page).toContain('function invalidateSocialRenderCache({ center = true } = {})');
        expect(page).not.toContain('function renderRail(');
        expect(page).not.toContain('social-neo-rail-region');
        expect(page).toContain('function buildDirectoryFingerprint(runtime)');
        expect(page).toContain('function buildReportsFingerprint(runtime)');
        expect(page).toContain('window.__kiuSocialPatchEventRsvp = patchEventRsvpButtons');
        expect(readSource('assets/js/pages/social-render-plan.js')).toMatch(/reason === 'mobile-nav'/);
        expect((page + readSource('assets/js/pages/social-events.js'))).toContain("'event-created'");
        expect((page + readSource('assets/js/pages/social-groups.js'))).toContain("'group-membership'");

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
        panelHandlers.forEach(([action, renderCall]) => {
            expect(page).toMatch(new RegExp(`action === '${action}'[\\s\\S]*${renderCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        });

        expect((page + readSource('assets/js/pages/social-groups.js'))).toMatch(/action === 'group-join'[\s\S]*renderSocialPageNow\('group-membership'\)/);
        expect((page + readSource('assets/js/pages/social-events.js'))).toMatch(/formType === 'dialog-event-delete'[\s\S]*renderSocialPageNow\('event-deleted'\)/);
        expect((page + readSource('assets/js/pages/social-feed.js'))).toMatch(/formType === 'dialog-post-delete'[\s\S]*renderSocialPageNow\('post-deleted'\)/);
        expect((page + readSource('assets/js/pages/social-alerts.js'))).toMatch(/action === 'report-resolve'[\s\S]*renderSocialPageNow\('report-resolve'\)/);

        expect(runtime).toContain('invalidatePortalSocialRenderCache: invalidateSocialRenderCache');
        expect(runtime).toMatch(/setFlash\('Event created\.'[\s\S]*skipRender: true/);
        expect(runtime).toMatch(/setFlash\('Event deleted\.'[\s\S]*skipRender: true/);
        expect(runtime).toMatch(/setFlash\('Post deleted\.'[\s\S]*skipRender: true/);
        expect(runtime).toContain("queueRender('event-deleted')");

        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(html).toContain('assets/js/shared/social-runtime-lite.js?v=20260713-post-compose1');
        expect(html).toContain('assets/js/pages/social-mobile.js?v=20260624-event-edit2');
        expect(app).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(app).toContain('assets/js/shared/social-runtime-lite.js?v=20260713-post-compose1');
        expect(app).toContain('assets/js/pages/social-mobile.js?v=20260624-event-edit2');
    });

    it('does not keep duplicate RSVP patch helpers', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const matches = page.match(/function patchEventRsvpButtons\(/g) || [];
        expect(matches).toHaveLength(1);
    });
});