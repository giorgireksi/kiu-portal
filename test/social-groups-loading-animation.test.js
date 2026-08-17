import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Groups loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Groups motion before Social boot', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        const homeIndex = html.indexOf('social-home-loading-runtime.js?v=20260817-instantassembly1');
        const communityIndex = html.indexOf('social-community-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const groupsIndex = html.indexOf('social-groups-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-groups-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(homeIndex).toBeGreaterThan(sharedIndex);
        expect(communityIndex).toBeGreaterThan(homeIndex);
        expect(groupsIndex).toBeGreaterThan(communityIndex);
        expect(interactionsIndex).toBeGreaterThan(groupsIndex);
    });

    it('targets the merged Groups hero, tabs, hub, cards, controls, and overlays', () => {
        const runtime = readSource('assets/js/pages/social-groups-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');

        expect(runtime).toContain("return document.querySelector('#social-neo-center-region')");
        expect(runtime).toContain("activePanel !== 'groups'");
        expect(runtime).toContain('.social-neo-groups-shell');
        expect(runtime).toContain('.social-neo-groups-hero');
        expect(runtime).toContain('.social-neo-groups-hero-grid');
        expect(runtime).toContain('.social-neo-groups-hub-body');
        expect(runtime).toContain('.social-neo-groups-grid');
        expect(runtime).toContain('.social-neo-group-card');
        expect(runtime).toContain('.social-neo-group-card-actions');
        expect(runtime).toContain('#social-neo-overlay-portal');
        expect(runtime).toContain('transformSafeSelector: []');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('new MutationObserver');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).not.toContain('motion.replay');
        expect(interactions).toContain('function queueSocialGroupsMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).not.toContain("section.dataset.socialGroupsAssemblyRoot = '1'");
        expect(interactions).toContain("[data-social-groups-assembly-root]");
        expect(interactions).toContain('window.__kiuStartSocialGroupsLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).toContain('Start sync in this turn');
        const groupsGate = interactions.match(
            /function queueSocialGroupsMotion[\s\S]*?function queueSocialProjectsMotion/
        )?.[0] || '';
        expect(groupsGate).toContain('const shouldAnimate = shouldAnimateSocialPanelMotion');
        expect(readSource('assets/css/social-groups-loading.css')).toContain('Keep openers clickable');
    });

    it('starts the shared engine for an already-rendered Groups panel', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="groups"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-groups-shell social-neo-groups-shell--merged">
                        <section class="social-neo-card social-neo-groups-hero home-hover-chip">
                            <div class="social-neo-groups-hero-grid">
                                <button class="lux-secondary-btn social-neo-groups-hero-tab" type="button">Discover</button>
                            </div>
                            <div class="social-neo-groups-hub-body">
                                <div class="social-neo-groups-grid">
                                    <article class="social-neo-card social-neo-group-card home-hover-chip">
                                        <strong>Group</strong>
                                        <button class="lux-primary-btn" type="button">View</button>
                                    </article>
                                </div>
                            </div>
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
        new Function('window', readSource('assets/js/pages/social-groups-loading-runtime.js'))(window);

        try {
            await wait(80);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialGroupsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialGroupsLoadingMotion;
            delete window.__kiuStartSocialGroupsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts the Groups assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(sw).toContain('social-groups-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-groups-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-projects-loading-runtime.js?v=20260817-instantassembly1');
    });
});
