import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux scrollbar regressions', () => {
    it('ships global scrollbar tokens and primitive styles', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        const layout = readSource('assets/css/lux-layout-primitives.css');
        const indexLuxury = readSource('assets/css/index-luxury.css');

        expect(tokens).toContain('--lux-scrollbar-thumb');
        expect(tokens).toContain('--lux-scrollbar-thumb-hover');
        expect(tokens).toContain('--lux-scrollbar-track');
        expect(tokens).toContain('--lux-scrollbar-size');
        expect(tokens).toContain('--lux-scrollbar-thumb: rgba(48, 34, 22, 0.18)');
        expect(layout).toContain('.lux-scrollbar');
        expect(layout).toContain('::-webkit-scrollbar-thumb');
        expect(layout).toContain('body.lux-unified-shell :is(');
        expect(layout).toContain('.lux-scroll-rail__viewport');
        expect(layout).toContain('.lux-admin-tools-builder-body');
        expect(indexLuxury).toContain('.lux-nav::-webkit-scrollbar');
        expect(indexLuxury).toContain('scrollbar-color: var(--lux-scrollbar-thumb)');
    });

    it('wires admin-tools scroll hotspots to lux-scrollbar', () => {
        const registration = readSource('assets/js/pages/registration.js');
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');
        const adminToolsCss = readSource('assets/css/admin-tools-luxury.css');

        expect(registration).toContain('lux-scrollbar curriculum-library-list');
        expect(registration).toContain('lux-scrollbar lux-scroll-rail__viewport curriculum-library-row-list');
        expect(bundle).toContain('lux-scrollbar lux-admin-tools-builder-body');
        expect(bundle).toContain('lux-scrollbar lux-semester-scroll-list');
        expect(adminToolsCss).toContain('.lux-admin-tools-builder-body');
        expect(adminToolsCss).toContain('scrollbar-color: var(--lux-scrollbar-thumb)');
    });

    it('dedupes route-local scrollbar colors to shared tokens', () => {
        const social = readSource('assets/css/social-projects-lms.css');
        const surfaces = readSource('assets/css/lux-surfaces.css');

        expect(social).toContain('var(--lux-scrollbar-thumb)');
        expect(social).not.toContain('rgba(var(--sn-proj-accent-rgb), .18)');
        expect(surfaces).toContain('scrollbar-color: var(--lux-scrollbar-thumb)');
    });
});