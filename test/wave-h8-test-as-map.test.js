/**
 * Wave H8 — Test as map (≥8/10): contract index + CONTRACT banners.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave H8 test as map', () => {
    const manifest = JSON.parse(read('tools/test-contract-manifest.json'));

    it('docs and manifest exist with ≥10 contracts', () => {
        expect(existsSync(join(ROOT, 'docs/test-as-map.md'))).toBe(true);
        expect(read('docs/test-as-map.md')).toContain('test-contract-manifest.json');
        expect(read('docs/human-maintainability.md')).toContain('test-as-map.md');
        expect(manifest.contracts.length).toBeGreaterThanOrEqual(manifest.minContracts || 10);
        expect(manifest.contracts.length).toBeGreaterThanOrEqual(10);
    });

    it('every manifest test exists and carries a CONTRACT banner', () => {
        const seen = new Set();
        for (const entry of manifest.contracts) {
            expect(entry.id).toBeTruthy();
            expect(entry.test).toBeTruthy();
            expect(entry.invariant).toBeTruthy();
            expect(existsSync(join(ROOT, entry.test)), entry.test).toBe(true);
            const source = read(entry.test);
            expect(source, entry.test).toMatch(/CONTRACT:/);
            seen.add(entry.id);
        }
        expect(seen.size).toBe(manifest.contracts.length);
    });

    it('gradebook load-chain contract is indexed and asserts shared order', () => {
        const entry = manifest.contracts.find((c) => c.id === 'lms.gradebook-load-chain');
        expect(entry).toBeTruthy();
        expect(entry.test).toBe('test/gradebook-load-chain-contract.test.js');
        const source = read(entry.test);
        expect(source).toContain('GRADEBOOK_MODULE_PATHS');
        expect(source).toContain('LMS_GRADEBOOK_MODULE_URLS');
    });

    it('rubric claims Test as map 8/10 with H8; Human A+ claimed', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Test as map[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H8\s*✅/);
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/\|\s*8 Test as map\s*\|\s*~5\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
    });
});
