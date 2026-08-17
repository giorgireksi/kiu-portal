const { readFileSync } = require('fs');
const { join } = require('path');

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('weak-device visual scheduling safeguards', () => {
    it('coalesces visual refresh work by task key', () => {
        const model = readSource('assets/js/features/luxury-transparency-model-runtime.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(model).toContain('window.__kiuQueueLuxuryVisualTask');
        expect(model).toContain('framePending');
        expect(model).toContain('idlePending');
        expect(transparency).toContain("'transparency-observer'");
    });

    it('keeps normal observer margins while narrowing only constrained-device work', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const schedulerRuntime = readSource('assets/js/features/luxury-visual-runtime.js');
        for (const source of [runtime, schedulerRuntime]) {
            expect(source).toContain('getHeavySurfaceObserverRootMargin');
            expect(source).toContain("'120px 0px 120px 0px'");
            expect(source).toContain("'300px 0px 300px 0px'");
        }
    });

    it('avoids an ungoverned startup particle frame', () => {
        const particles = readSource('assets/js/features/luxury-particle-background.js');
        expect(particles).toContain('particleLoopTimer = window.setTimeout(tick, readParticleFrameInterval());');
        expect(particles).not.toContain('particleLoopTimer = window.setTimeout(tick, 0);');
    });

    it('slows readiness polling only on constrained devices', () => {
        const assembly = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        expect(assembly).toContain('const assemblyPollMs');
        expect(assembly).toContain('? 32 : 16');
        expect(assembly).toContain('window.setTimeout(tick, assemblyPollMs)');
        expect(assembly).toContain('window.setTimeout(poll, assemblyPollMs)');
    });

    it('does not attach hover events that can drive the visual governor', () => {
        const motion = readSource('assets/js/features/luxury-shell-motion-runtime.js');
        expect(motion).not.toContain("addEventListener('pointermove'");
        expect(motion).not.toContain("addEventListener('pointerover'");
        expect(motion).toContain('ordinary hover must');
    });
});
