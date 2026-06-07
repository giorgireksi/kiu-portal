import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('particle background route integration', () => {
    it('exposes portal particle background globals', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('window.__kiuInitLuxuryParticleBackground = initLuxuryParticleBackground');
        expect(particle).toContain('window.__kiuRefreshLuxuryBackground = refreshLuxuryParticleBackground');
        expect(particle).toContain('function applyLmsParticleTheme()');
        expect(particle).toContain('lux-bg-canvas');
    });

    it('migrates legacy background mode names to particle variants', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain("if (normalized === 'constellation') return 'peak'");
        expect(luxury).toContain("if (normalized === 'aurora') return 'orbit'");
        expect(luxury).toContain("if (normalized === 'mesh') return 'corners'");
        expect(luxury).toContain("key: 'peak'");
        expect(luxury).toContain('particleMotion');
        expect(luxury).toContain('particleDensity');
        expect(luxury).toContain('particleQuality');
    });

    it('initializes particle background from index-luxury ready hook', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('window.__kiuInitLuxuryParticleBackground');
        expect(luxury).not.toContain('startBackground();');
    });

    it('loads particle background module on luxury html entry points', () => {
        const htmlFiles = [
            'index.html',
            'lms.html',
            'profile.html',
            'orders.html'
        ];
        htmlFiles.forEach((file) => {
            const html = readSource(file);
            expect(html).toContain('luxury-particle-background.js');
        });
    });

    it('reads LMS css variables for particle theme colors', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain("--lux-accent");
        expect(particle).toContain("--lux-accent-2");
        expect(particle).toContain("--lux-bg");
        expect(particle).toContain('lux-light-mode');
    });

    it('does not freeze motion based on performance tier', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('staticBackgroundOnly = !animationsEnabled');
        expect(particle).not.toContain("staticBackgroundOnly = getPerformanceTier() === 'efficient'");
        expect(particle).not.toContain('targetMotion = reducedMotion || staticBackgroundOnly');
        expect(particle).toContain('scheduleParticleBackgroundSelfInit');
    });

    it('uses full-opacity particle presentation when background animation is on', () => {
        const css = readSource('assets/css/index-luxury.css');
        expect(css).toContain('body[data-lux-background-animation="on"] #lux-bg-canvas');
        expect(css).toMatch(/body\[data-lux-background-animation="on"\] #lux-bg-canvas[\s\S]*opacity:\s*1/);
        expect(css).toContain('body[data-lux-background-animation="on"] #lux-bg-overlay');

        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain("backgroundAnimationsEnabled ? '1' : '0'");
        expect(luxury).toContain("setProperty('--lux-overlay-opacity', '0')");
    });

    it('snaps particle density and motion on portal refresh', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('function applyParticleSettingsNow()');
        expect(particle).toContain('uniforms.uDensityFade.value = targetDensity');
        expect(particle).toContain('mapPortalDensityToShader');
        expect(particle).toContain('applyParticleSettingsNow();');
    });

    it('builds darkened light-mode backdrop tokens from palette accents', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('function buildLightModeBackdropTokens');
        expect(luxury).toMatch(/lightMode[\s\S]*buildLightModeBackdropTokens\(accentRgb, accent2Rgb/);
        expect(luxury).toContain('lightLineRgb');
        expect(luxury).toContain('lightBackdrop.particle');
    });

    it('uses palette particle tokens and avoids white wash in light mode', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('function rgbTripletToColor');
        expect(particle).toContain('--lux-bg-line-rgb');
        expect(particle).toContain('--lux-bg-particle-rgb');
        expect(particle).toContain('--lux-bg-haze-rgb');
        expect(particle).toMatch(/if \(lightMode\) \{[\s\S]*rgbTripletToColor\(lineRgb/);
        expect(particle).not.toMatch(/lightMode \? 0\.68 : 0\.58/);
        expect(particle).toContain('material.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending');
        expect(particle).toContain('material.needsUpdate = true');
        expect(particle).toContain('ribbonMaterial.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending');
        expect(particle).toContain('function ensureContrastAgainstBackground');
        expect(particle).toContain('uAlphaFloor');
    });

    it('refreshes resolved palette on theme toggle and faculty switch', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const utilities = readSource('assets/js/shared/utilities.js');
        const themeBlock = luxury.slice(
            luxury.indexOf('function applyThemeMode'),
            luxury.indexOf('function sanitizeBackgroundMode')
        );
        expect(themeBlock).toContain('applyResolvedPalette()');
        expect(luxury).toMatch(/applyPaletteValues[\s\S]*__kiuApplyResolvedPalette/);
        expect(utilities).toMatch(/applyFacultyLuxuryTheme[\s\S]*__kiuApplyResolvedPalette/);
        expect(utilities).toContain('__kiuApplyLmsParticleTheme');
    });

    it('rebuilds variant geometry when studio switches particle mode', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const refreshBlock = particle.slice(
            particle.indexOf('function refreshLuxuryParticleBackground'),
            particle.indexOf('function disposeLuxuryParticleBackground')
        );
        expect(refreshBlock).toContain('setVariant(validMode)');
        expect(refreshBlock).not.toMatch(/activeVariantName\s*=\s*validMode[\s\S]*setVariant\(validMode\)/);
        expect(particle).toContain('const nextVariant = normalizeVariantKey(readPortalVariant())');
    });

    it('caps particle quality on efficient tier only when quality is auto', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const resolveQualityBlock = particle.slice(
            particle.indexOf('function resolveQuality'),
            particle.indexOf('function detectQualityProfile')
        );
        expect(resolveQualityBlock).toMatch(/if \(resolvedKey === "auto"\)[\s\S]*getPerformanceTier\(\) === "efficient"/);
        const afterAutoBlock = resolveQualityBlock.replace(
            /if \(resolvedKey === "auto"\) \{[\s\S]*?\n  \}/,
            ''
        );
        expect(afterAutoBlock).not.toContain('getPerformanceTier() === "efficient"');
    });
});
