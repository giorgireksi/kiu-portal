import { describe, expect, it } from 'vitest';
import { readSource } from './helpers/bare-shell-css.js';

const CANONICAL_CHIP_SELECTORS = [
    '.lux-mode-btn',
    '.lux-control-btn',
    '.lux-fog-profile-bank-btn',
    '.lux-fog-profile-action-btn',
    '.lux-bg-mode-item',
    '.lux-fog-profile-item',
    '.lux-bg-gallery-tile',
    '.lux-bg-gallery-tab',
    '.lux-bg-gallery-upload-btn',
    '.lux-bg-gallery-icon-btn',
    '[data-particle-quality]',
    '[data-glass-blur-quality]',
];

function extractChipIsList(block, variant) {
    if (variant === 'hover') {
        const match = block.match(
            /@media \(hover: hover\) and \(pointer: fine\) \{\s*:is\([^)]+\) :is\(\s*([\s\S]*?)\s*\):hover:not\(:disabled\),\s*#lux-studio-backdrop \.lux-bg-mode-item:has/
        );
        return match?.[1]?.split(',').map((token) => token.trim()).filter(Boolean) || [];
    }
    const match = block.match(
        /Soft-chrome chip shells[\s\S]*?:is\([^)]+\) :is\(\s*([\s\S]*?)\s*\) \{\s*position: relative/
    );
    return match?.[1]?.split(',').map((token) => token.trim()).filter(Boolean) || [];
}

describe('lux studio chip scope', () => {
    const studioCss = readSource('assets/css/lux-studio.css');
    const chipSection = studioCss.match(
        /\/\* Soft-chrome chip shells[\s\S]*?\/\* Shared studio \+ params control chrome \*\//
    )?.[0] || '';
    const chipBlock = studioCss.match(
        /\/\* Soft-chrome chip shells[\s\S]*?@media \(hover: hover\) and \(pointer: fine\)/
    )?.[0] || '';

    const staticCardBlock = studioCss.match(
        /\/\* Static studio cards[\s\S]*?#lux-studio-backdrop \.lux-studio-section:not\(:has/
    )?.[0] || '';

    it('does not treat lux-studio-section wrappers as interactive chips', () => {
        expect(chipBlock).not.toContain('.lux-studio-section:not(:has');
    });

    it('does not clip transparency sliders with chip overflow hidden', () => {
        expect(chipBlock).not.toContain('.lux-transparency-control');
        expect(chipBlock).not.toContain('.lux-range-row');
        expect(chipBlock).not.toContain('.lux-mix-preview');
    });

    it('keeps compositor hover on mode buttons', () => {
        expect(studioCss).toMatch(/\.lux-mode-btn[\s\S]*::after/);
        expect(studioCss).toMatch(
            /\.lux-mode-btn[\s\S]*:hover:not\(:disabled\)[\s\S]*translate3d\(0, -3px, 0\)/
        );
    });

    it('stacks chip children above ::after glow layer', () => {
        expect(studioCss).toMatch(/\.lux-mode-btn[\s\S]*> \*[\s\S]*z-index:\s*1/);
        expect(studioCss).toMatch(/\.lux-control-btn[\s\S]*> \*[\s\S]*z-index:\s*1/);
        expect(studioCss).toMatch(/\.lux-bg-mode-item[\s\S]*> \*[\s\S]*z-index:\s*1/);
    });

    it('keeps palette chips on a separate style path', () => {
        expect(studioCss).toContain('#lux-studio-backdrop .lux-palette-chip');
        expect(studioCss).toContain('#lux-studio-backdrop .lux-palette-grid');
    });

    it('includes gallery icon and glass blur in chip hover lift', () => {
        const hoverLiftList = extractChipIsList(chipSection, 'hover');
        expect(hoverLiftList).toContain('.lux-bg-gallery-icon-btn');
        expect(hoverLiftList).toContain('[data-glass-blur-quality]');
    });

    it('keeps chip hover selectors in sync with base shell list', () => {
        const baseList = extractChipIsList(chipSection, 'base');
        const hoverLiftList = extractChipIsList(chipSection, 'hover');
        expect(baseList).toEqual(CANONICAL_CHIP_SELECTORS);
        expect(hoverLiftList).toEqual(CANONICAL_CHIP_SELECTORS);
    });

    it('restores static glass borders on control containers', () => {
        expect(staticCardBlock).toContain('.lux-transparency-control');
        expect(staticCardBlock).toContain('overflow: visible');
        expect(staticCardBlock).toMatch(/border:\s*1px solid var\(--lux-studio-chip-border\)/);
    });

    it('does not make static cards interactive chips', () => {
        expect(staticCardBlock).not.toContain('::after');
        expect(staticCardBlock).not.toMatch(/\btransform\b/);
    });

    it('restores section glass shells for palette and glass blur sections', () => {
        expect(studioCss).toMatch(
            /\.lux-studio-section:not\(:has\([\s\S]*border:\s*1px solid var\(--lux-studio-chip-border\)/
        );
    });

    it('rounds interactive chips and 3D background mode cards', () => {
        expect(chipBlock).toContain('border-radius: var(--lux-studio-chip-radius)');
        const bgModeRule = studioCss.match(
            /#lux-studio-backdrop \.lux-bg-mode-item \{[\s\S]*?\}/
        )?.[0] || '';
        expect(bgModeRule).toContain('border-radius: var(--lux-studio-chip-radius)');
        expect(bgModeRule).not.toMatch(/\bborder:\s*none\b/);
    });
});
