import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('particle same-look perf (gpuperf4m)', () => {
    it('ships adaptive DPR with temporal AA only when scaled down', () => {
        const particles = readSource('assets/js/features/luxury-particle-background.js');
        expect(particles).toContain('function updateAdaptivePixelScale');
        expect(particles).toContain('function getEffectiveRenderPixelRatio');
        expect(particles).toContain('function renderParticleSceneToScreen');
        expect(particles).toContain('adaptivePixelScale < 0.97');
        expect(particles).toContain('ensureTemporalPipeline');
        expect(particles).toContain('Math.max(0.72, adaptivePixelScale - 0.05)');
        expect(particles).toContain('Math.min(1, adaptivePixelScale + 0.02)');
    });

    it('paces slower under studio, modal, scroll, and shell hover without changing resting quality profiles', () => {
        const governor = readSource('assets/js/shared/lux-render-governor.js');
        const particles = readSource('assets/js/features/luxury-particle-background.js');
        const motion = readSource('assets/js/features/luxury-shell-motion-runtime.js');
        const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');
        expect(particles).toContain('lux-render-governor.js');
        expect(particles).toContain('readGovernedFrameIntervalMs');
        expect(particles).toContain('shouldSkipCanvasFrame');
        expect(governor).toContain('lux-studio-open');
        expect(governor).toContain('window.__luxIsScrolling');
        expect(governor).toContain('return 4.5');
        expect(governor).toContain('window.__luxShellHoverBusy');
        expect(governor).toContain('lux-shell-chrome-motion');
        expect(governor).toContain('data-lux-modal-overlay');
        expect(particles).toMatch(/high:\s*\{[\s\S]*?supersample:\s*1\.85/);
        expect(particles).toMatch(/balanced:\s*\{[\s\S]*?maxDpr:\s*1\.5/);
        expect(fog).toContain('readGovernedFrameIntervalMs');
        expect(fog).toContain('shouldSkipCanvasFrame');
        expect(motion).toContain('__luxShellHoverBusy');
        expect(motion).toContain('pulseShellHoverBusy');
        expect(motion).toContain('beginLuxAnimating');
        expect(motion).toContain('__luxIsAnimating');
        expect(motion).toContain("closest?.('#lux-shell, #lux-topbar, .lux-topbar-shell')");
        expect(motion).toContain("closest?.('.home-hover-chip')");
        expect(motion).toContain("addEventListener('pointerover'");
        // Hover must not arm MOTION_CLASS (would change blur look).
        expect(motion).toContain('do not arm MOTION_CLASS on control hover');
    });

    it('skips layered ribbon geometry rebuild when variant is not layered', () => {
        const particles = readSource('assets/js/features/luxury-particle-background.js');
        expect(particles).toContain('activeVariantName === "layered"');
        expect(particles).toContain('createLayeredRibbonGeometry(activeQuality)');
        expect(particles).toContain('new THREE.BufferGeometry()');
    });
});
