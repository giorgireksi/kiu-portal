import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('lux render governor', () => {
    it('centralizes pacing, modal cache, and canvas skip flags', () => {
        const governor = readSource('assets/js/shared/lux-render-governor.js');
        const app = readSource('assets/js/app/app.js');
        const particles = readSource('assets/js/features/luxury-particle-background.js');
        const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');

        expect(governor).toContain('export function getPacingMultiplier');
        expect(governor).toContain('export function isModalOverlayOpen');
        expect(governor).toContain('export function shouldSkipCanvasFrame');
        expect(governor).toContain('window.__luxShellHoverBusy === true');
        expect(governor).toContain('export function readGovernedFrameIntervalMs');
        expect(governor).toContain('export function shouldDeferTransparency');
        expect(governor).toContain('export function shouldDeferLegacyVisualRefresh');
        expect(governor).toContain('export function startLuxPortalPerfProbe');
        expect(governor).toContain('export function stopLuxPortalPerfProbe');
        expect(governor).toContain('window.startKiuPortalPerfProbe');
        expect(governor).toContain('longTasks');
        expect(app).toContain("import('../shared/lux-render-governor.js?v=20260820-shellinput1')");
        expect(app).toContain("get('perf') !== '1'");
        expect(governor).toContain('window.shouldDeferLuxTransparency');
        expect(governor).toContain('window.__luxIsScrolling');
        expect(governor).toContain('return 4.5');
        expect(governor).toContain('return 2.6');
        expect(governor).toContain('modalOpenCacheUntil = now + 200');

        expect(particles).toContain('lux-render-governor.js');
        expect(particles).toContain('readGovernedFrameIntervalMs');
        expect(particles).toContain('onGovernorStateChange');

        expect(fog).toContain('lux-render-governor.js');
        expect(fog).toContain('readGovernedFrameIntervalMs');
        expect(fog).toContain('shouldSkipCanvasFrame');
        expect(fog).toContain('onGovernorStateChange');
    });

    it('notifies governor listeners from scroll and shell motion edges', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const motion = readSource('assets/js/features/luxury-shell-motion-runtime.js');

        expect(luxury).toContain('notifyLuxGovernorStateChange');
        expect(motion).toContain('notifyLuxGovernorStateChange');
    });
});
