import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social initial loading animation', () => {
    it('wires the shared engine and Social-only motion assets after Social scripts', () => {
        const html = readSource('social.html');
        const sw = readSource('service-worker.js');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260809-assembly16');
        const configIndex = html.indexOf('social-loading-runtime.js?v=20260809-socialassembly8');

        expect(html).toContain('social-loading.css?v=20260809-socialassembly3');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(configIndex).toBeGreaterThan(sharedIndex);
        expect(html).toMatch(/social-page\.js\?v=[^"]+[\s\S]*lux-assembly-loading-runtime\.js\?v=/);
        expect(html).toMatch(/social-page-interactions-runtime\.js\?v=20260809-socialloading7/);
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260809-socialassembly16'");
        expect(sw).toContain('lux-assembly-loading-runtime.js?v=20260809-assembly16');
        expect(sw).not.toContain('lux-assembly-loading-runtime.js?v=20260809-assembly15');
    });

    it('targets the complete initial Social surface without late replay', () => {
        const runtime = readSource('assets/js/pages/social-loading-runtime.js');
        const regions = runtime.slice(
            runtime.indexOf('const socialRegions'),
            runtime.indexOf('const socialTextTargets')
        );

        [
            '#public-social-root',
            '#social-neo-workspace-nav-region',
            '#social-neo-center-region',
            '.social-neo-shell',
            '.social-neo-card',
            '.social-neo-feed-mobile-stack',
            '.social-neo-feed-hero-actions',
            '.social-neo-feed-hero-grid',
            '.social-neo-stack',
            '.social-neo-side-link',
            '.social-neo-feed-hero-tab',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            '#social-neo-overlay-portal',
            'button',
            'input',
            'select',
            'textarea',
            'i'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain('root?.dataset.socialInitialRenderReady === \'1\'');
        expect(runtime).toContain('autoStart: false');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('unlimitedLateReplay: true');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('transformSafeSelector:');
        expect(runtime).toContain('[aria-hidden="true"]:not(i):not(.social-neo-feed-header-divider)');
        expect(runtime).toContain('.lux-picker-panel');
        expect(runtime).toContain('outerDurationMs: 260');
        expect(runtime).toContain('maxTotalAssemblyMs: 1350');
        expect(runtime).toContain("structureSelector: ['#social-neo-root']");
        expect(runtime).toContain("outerSelectors: [\n            '.social-neo-shell'");
        expect(runtime).not.toContain('outerSelectors: socialRegions');
        expect(runtime).toContain('#social-neo-call-overlay');
        expect(runtime).toContain('.lux-section-card');
        expect(runtime).toContain('.lux-picker-field');
        expect(runtime).toContain('.lux-picker-copy');
        expect(runtime).toContain('[class*="sn-alert"]');
        expect(runtime).toContain('[class*="social-project-"]');
        expect(runtime).toContain('[class*="social-photo-"]');
        expect(regions).not.toContain('#social-neo-overlay-portal');
        expect(regions).not.toContain('#mobile-action-sheet');
        expect(runtime).not.toContain('__kiuReplaySocialLoadingMotion');
        expect(runtime).toContain('navigator.serviceWorker.getRegistration');
    });

    it('marks only the first completed initial render ready', () => {
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');

        expect(interactions).toContain('reason === \'boot\'');
        expect(interactions).toContain('const initialRenderWindow = host.dataset.socialAssemblyState !== \'ready\'');
        expect(interactions).toContain('host.dataset.socialInitialRenderReady !== \'1\'');
        expect(interactions).toContain('host.dataset.socialAssemblyState !== \'ready\'');
        expect(interactions).toContain('const initialSurfaceReady = Boolean(');
        expect(interactions).toContain('.social-neo-card.sn-mat-soft');
        expect(interactions).toContain('const shouldStartInitialMotion = initialRenderWindow');
        expect(interactions).toContain('function startSocialAssemblyMotion(host)');
        expect(interactions).toContain('function retrySocialAssemblyMotion(host)');
        expect(interactions).toContain('function queueSocialAssemblyReplay(renderPlan, reason)');
        expect(interactions).toContain('window.__kiuSocialLoadingMotion?.replay?.(scopes)');
        expect(interactions).toContain('host.dataset.socialInitialMotionFallback');
        expect(interactions).toContain('const initialMotionCanReveal = initialMotionStarted');
        expect(interactions).toContain('if (initialMotionCanReveal)');
        expect(interactions).toContain('host.dataset.socialInitialRenderReady = \'1\'');
        expect(interactions).toContain('data-social-initial-render-ready');
        expect(interactions).not.toContain('__kiuReplaySocialLoadingMotion');
        expect(boot).not.toMatch(/kiu-shell-loading[\s\S]{0,180}revealShell\(\)/);
    });

    it('keeps Social loading CSS motion-only and restores interaction', () => {
        const css = readSource('assets/css/social-loading.css');

        expect(css).toContain('is-social-assembly-staging');
        expect(css).toContain('is-flight');
        expect(css).toContain('visibility: hidden');
        expect(css).toContain('visibility: visible');
        expect(css).toContain('pointer-events: none');
        expect(css).toContain('pointer-events: auto');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
    });

    it('preserves Social navigation, mobile, and overlay portals', () => {
        const html = readSource('social.html');

        [
            'social-neo-workspace-nav-region',
            'social-neo-center-region',
            'mobile-bottom-nav',
            'mobile-action-sheet',
            'social-neo-overlay-portal',
            'lux-glass-dialog-region'
        ].forEach((id) => expect(html).toContain(`id="${id}"`));
    });
});
