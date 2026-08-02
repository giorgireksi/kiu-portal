import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-lost-found-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('lost and found cards use scroll rails for listing descriptions', () => {
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const page = readSource('assets/js/pages/social-page.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const renderCardChunk = lostFound.slice(
            lostFound.indexOf('const renderLfCardDescRail ='),
            lostFound.indexOf('const heroMetrics =')
        );

        expect(lostFound).toContain('const renderLfCardDescRail =');
        expect(renderCardChunk).toContain('data-lf-desc-rail');
        expect(renderCardChunk).toContain('lux-scroll-rail__dock--vertical');
        expect(renderCardChunk).toContain('hidden aria-hidden="true"');
        expect(renderCardChunk).not.toMatch(/<div class="social-neo-muted">\$\{escape\(text\(item\.description/);
        expect(bare).toMatch(/\.social-neo-lf-card-desc-viewport\s*\{[\s\S]{0,300}max-height:\s*calc\(1\.45em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-lf-card-desc-rail\.is-scrollable[\s\S]{0,400}min-height:\s*calc\(1\.45em \* 6 \+ 16px \+ 12px\)/);
        expect(bare).toMatch(/\.social-neo-lf-card-desc\s*\{[\s\S]{0,200}word-break:\s*break-word/);
        expect(page).toContain('social-lost-found.js?v=20260802-lf-desc-rail1');
        expect(interactions).toMatch(/activePanel === 'lost-and-found'\)[\s\S]{0,80}syncEventDescScrollRails/);
    });
});
