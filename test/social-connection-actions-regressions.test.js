import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social connection actions regressions', () => {
    it('re-renders community and rail relationship buttons without full-shell scroll jumps', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');
        const communitySource = readSource('assets/js/pages/social-community.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');
        const appSource = readSource('assets/js/app/app.js');

        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(html).toContain('assets/js/shared/social-runtime-lite.js?v=20260713-post-compose1');
        expect(html).toContain('assets/js/pages/social-mobile.js?v=20260624-event-edit2');
        // app.js still lazy-loads social stack when public-social-root is present.
        expect(appSource).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(appSource).toContain('assets/js/shared/social-runtime-lite.js?v=20260713-post-compose1');
        expect(appSource).toContain('assets/js/pages/social-mobile.js?v=20260624-event-edit2');

        expect(source).toContain('function buildRelationshipsFingerprint(runtime)');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('relationshipMutationReasons');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain("reason === 'flash' || reason === 'flash-clear'");
        expect(source).toContain('function rememberInteractionAnchor(host, trigger)');
        expect(source).toContain('function scheduleDeferredWindowScrollRestore(host, snapshot)');
        expect(source).toContain('function applyWindowScrollRestore(host, snapshot)');
        expect((source + communitySource)).toContain('rememberInteractionAnchor(root(), trigger)');
        // Rail region removed; center markup cache is busted on relationship mutations.
        expect(source).toContain('delete shell.center.__kiuLastMarkup');
        expect((source + communitySource)).toContain("renderSocialPageNow('connection-send')");
        expect((source + communitySource)).toContain("renderSocialPageNow('connection-cancel')");
        expect(source).toMatch(/const fastPath = reason === 'boot' \|\| \/\^\(comment-\|post-react\|post-save\|post-pin/);
        expect(source).toContain('connection-|page-follow|page-report|flash|dialog-');
        expect(source).toContain('.test(reason)');

        expect(runtimeSource).toContain('function mergeSocialRelationship(relationship)');
        expect(runtimeSource).toContain('skipRender: true');
        const requestConnectionBlock = runtimeSource.match(/async function requestConnection[\s\S]*?(?=\n    async function )/)?.[0] || '';
        const removeConnectionBlock = runtimeSource.match(/async function removeConnection[\s\S]*?(?=\n    async function )/)?.[0] || '';
        expect(requestConnectionBlock).not.toContain('loadSocialState(true)');
        expect(removeConnectionBlock).not.toContain('loadSocialState(true)');

        expect(communitySource).toContain('social-neo-community-card" data-user-id=');
        expect(css).toContain('overflow-anchor: none');
    });
});