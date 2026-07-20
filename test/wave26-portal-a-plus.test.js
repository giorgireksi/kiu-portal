/**
 * Wave 26 — Portal A+ 10 claim: bare ≤900, ESM ≥8, no bundler/TS.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

describe('Wave 26 Portal A+ 10', () => {
    it('social-feed exposes KiuSocialFeed bag', () => {
        const src = readAsset('assets/js/pages/social-feed.js');
        expect(src).toContain('window.KiuSocialFeed');
        expect(src).toContain('__kiuFeedApi');
        expect(src).toContain('__kiuFeedExpose');
        expect(src).not.toMatch(/^window\.renderPost\s*=/m);
    });

    it('gates: bare ≤900 and ESM ≥10 (Portal A+ 10 + E5)', () => {
        const guard = readAsset('tools/check-architecture-guardrails.js');
        expect(guard).toMatch(/BARE_WINDOW_ASSIGN_MAX\s*=\s*900/);
        const match = guard.match(/ESM_LEAF_MIN\s*=\s*(\d+)/);
        expect(match).toBeTruthy();
        expect(Number(match[1])).toBeGreaterThanOrEqual(10);
    });

    it('docs claim Portal A+ 10', () => {
        const docs = readAsset('docs/engineering-a-plus-frontend-js.md');
        expect(docs).toMatch(/Portal A\+ 10/);
        expect(docs).toMatch(/Wave 26/);
        expect(docs).toMatch(/bare.*≤\*\*900\*\*|BARE.*900|bare ≤900/i);
        expect(docs).toMatch(/≥\*\*10\*\*|ESM_LEAF_MIN = 10|ESM leaves ≥\*\*10\*\*|≥10 ESM/);
    });
});
