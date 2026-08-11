import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social People loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads the People motion before Social boot and keeps it separate from Home', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260810-assembly25');
        const homeIndex = html.indexOf('social-home-loading-runtime.js?v=20260810-socialhomeanim5');
        const communityIndex = html.indexOf('social-community-loading-runtime.js?v=20260810-socialbootveil2');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-community-loading.css?v=20260809-socialpopup1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(homeIndex).toBeGreaterThan(sharedIndex);
        expect(communityIndex).toBeGreaterThan(homeIndex);
        expect(interactionsIndex).toBeGreaterThan(communityIndex);
    });

    it('targets the merged Community hero, directory cards, controls, and overlays safely', () => {
        const runtime = readSource('assets/js/pages/social-community-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');

        expect(runtime).toContain("return document.querySelector('#social-neo-center-region')");
        expect(runtime).toContain("activePanel !== 'community'");
        expect(runtime).toContain('.social-neo-community-shell');
        expect(runtime).toContain('.social-neo-community-hero');
        expect(runtime).toContain('.social-neo-community-hero-stats');
        expect(runtime).toContain('.social-neo-community-hero-grid');
        expect(runtime).toContain('.social-neo-community-hero-toolbar');
        expect(runtime).toContain('.social-neo-directory-item');
        expect(runtime).toContain('.social-neo-community-actions');
        expect(runtime).toContain('.lux-picker-panel');
        expect(runtime).toContain('#social-neo-overlay-portal');
        expect(runtime).toContain('transformSafeSelector: []');
        expect(runtime).toContain('flattenInnerTargets: false');
        expect(runtime).toContain('maxTotalAssemblyMs: 2000');
        expect(runtime).toContain('new MutationObserver');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).not.toContain('motion.replay');
        expect(interactions).toContain('function queueSocialCommunityMotion(center, activePanel, reason)');
        expect(interactions).toContain("reason === 'boot'");
        expect(interactions).toContain("reason === 'community-module'");
        expect(interactions).toContain("reason === 'panel-community'");
        expect(interactions).not.toContain("section.dataset.socialCommunityAssemblyRoot = '1'");
        expect(interactions).toContain("[data-social-community-assembly-root]");
        expect(interactions).toContain('window.__kiuStartSocialCommunityLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).toContain('Start sync in this turn');
        const communityGate = interactions.match(
            /function queueSocialCommunityMotion[\s\S]*?function queueSocialGroupsMotion/
        )?.[0] || '';
        expect(communityGate).toContain("reason === 'boot'");
        expect(readSource('assets/css/social-community-loading.css')).toContain('Keep openers clickable');
    });

    it('starts the shared engine for an already-rendered People panel', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="community"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-community-shell">
                        <section class="social-neo-card social-neo-community-hero home-hover-chip">
                            <button class="lux-secondary-btn" type="button">People</button>
                            <article class="social-neo-directory-item social-neo-community-card home-hover-chip">
                                <strong>Student</strong>
                            </article>
                        </section>
                    </div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = function (keyframes) {
            calls.push({ element: this, keyframes });
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-community-loading-runtime.js'))(window);

        try {
            await wait(80);
            expect(calls.length).toBeGreaterThan(0);
            const buttonFlight = calls.find(({ element }) => element.matches('button'));
            expect(buttonFlight.keyframes.some((frame) => String(frame.transform || '').includes('translate3d(-'))).toBe(true);
        } finally {
            window.__kiuSocialCommunityLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialCommunityLoadingMotion;
            delete window.__kiuStartSocialCommunityLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts the People assets with the new Social shell cache', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260810-homeassembly5'");
        expect(sw).toContain('social-community-loading.css?v=20260809-socialpopup1');
        expect(sw).toContain('social-community-loading-runtime.js?v=20260810-socialbootveil2');
        expect(sw).toContain('social-groups-loading-runtime.js?v=20260810-socialbootveil2');
    });
});
