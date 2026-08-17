import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Projects workspace loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Projects motion before Social boot', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        const homeIndex = html.indexOf('social-home-loading-runtime.js?v=20260817-instantassembly1');
        const communityIndex = html.indexOf('social-community-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const groupsIndex = html.indexOf('social-groups-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const projectsIndex = html.indexOf('social-projects-loading-runtime.js?v=20260817-instantassembly1');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2&perf=20260816-singleowner9');

        expect(html).toContain('social-projects-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(homeIndex).toBeGreaterThan(sharedIndex);
        expect(communityIndex).toBeGreaterThan(homeIndex);
        expect(groupsIndex).toBeGreaterThan(communityIndex);
        expect(projectsIndex).toBeGreaterThan(groupsIndex);
        expect(interactionsIndex).toBeGreaterThan(projectsIndex);
    });

    it('targets the Projects workspace hub and detail surfaces without touching overlays', () => {
        const runtime = readSource('assets/js/pages/social-projects-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');

        expect(runtime).toContain("return document.querySelector('#social-neo-center-region')");
        expect(runtime).toContain("activePanel !== 'workspace'");
        expect(runtime).toContain("__kiuShouldBindSocialLoadingFallback('workspace')");
        expect(runtime).toContain('.social-neo-workspace-shell');
        expect(runtime).toContain('.social-neo-workspace-hero');
        expect(runtime).toContain('.social-project-hub-filterbar');
        expect(runtime).toContain('.social-project-hub-grid');
        expect(runtime).toContain('.social-project-hub-rail-card');
        expect(runtime).toContain('.social-project-card-new');
        expect(runtime).toContain('.social-project-detail-hero');
        expect(runtime).toContain('.social-project-task-shell');
        expect(runtime).toContain('#social-neo-overlay-portal');
        expect(runtime).toContain('transformSafeSelector: []');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('animateProjectSearchIcon');
        expect(runtime).toContain('scale(.62)');
        expect(runtime).toContain('is-social-project-search-pending');
        expect(runtime).toContain('new MutationObserver');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).not.toContain('motion.replay');
        expect(interactions).toContain('function queueSocialProjectsMotion(center, activePanel, reason)');
        expect(interactions).toContain("shouldAnimateSocialPanelMotion('workspace', activePanel, reason)");
        expect(interactions).toContain("/^panel-/.test(r)");
        const workspaceGate = interactions.match(
            /function queueSocialProjectsMotion[\s\S]*?function queueSocialPortfolioMotion/
        )?.[0] || '';
        expect(workspaceGate).toContain("shouldAnimateSocialPanelMotion('workspace', activePanel, reason)");
        expect(interactions).toContain('Start sync in this turn');
        expect(interactions).not.toContain("section.dataset.socialProjectsAssemblyRoot = '1'");
        expect(interactions).toContain("[data-social-projects-assembly-root]");
        expect(interactions).toContain('window.__kiuStartSocialProjectsLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(readSource('assets/css/social-projects-loading.css')).toContain('Keep openers clickable');
    });

    it('starts the shared engine for an already-rendered Projects hub', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="workspace"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-workspace-shell social-neo-workspace-shell--merged">
                        <section class="social-neo-card social-neo-workspace-hero home-hover-chip">
                            <div class="social-neo-workspace-hero-stats">
                                <article class="social-neo-workspace-hero-stat"><strong>1</strong><span>Active</span></article>
                            </div>
                            <div class="social-project-hub-layout">
                                <label class="social-project-hub-search">
                                    <i class="fas fa-search"></i>
                                    <input type="search" name="projectDiscoverSearch">
                                </label>
                                <div class="social-project-hub-grid">
                                    <article class="social-project-card-new home-hover-chip">
                                        <strong>Workspace</strong>
                                        <button class="lux-primary-btn" type="button">Open</button>
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
        new Function('window', readSource('assets/js/pages/social-projects-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialProjectsLoadingMotion?.getState?.().phase).toBe('ready');
            expect(calls).toHaveLength(0);
        } finally {
            window.__kiuSocialProjectsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialProjectsLoadingMotion;
            delete window.__kiuStartSocialProjectsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts the Projects workspace assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage1'");
        expect(sw).toContain('social-projects-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-projects-loading-runtime.js?v=20260817-instantassembly1');
    });
});
