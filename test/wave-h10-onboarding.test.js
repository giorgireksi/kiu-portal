/**
 * Wave H10 — Onboarding docs (≥8/10): day-1 front door composing indexes.
 * CONTRACT: README + ONBOARDING exist; required index links resolve; boot scripts live; Human A+.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave H10 onboarding docs', () => {
    const manifest = JSON.parse(read('tools/onboarding-manifest.json'));
    const pkg = JSON.parse(read('package.json'));

    it('entry docs exist and README points at ONBOARDING', () => {
        for (const doc of manifest.entryDocs) {
            expect(existsSync(join(ROOT, doc)), doc).toBe(true);
        }
        expect(read('README.md')).toMatch(/ONBOARDING\.md/);
        expect(read('docs/ONBOARDING.md')).toMatch(/findability-index/);
        expect(read('docs/human-maintainability.md')).toContain('ONBOARDING.md');
    });

    it('every requiredLinks path exists and is referenced from ONBOARDING', () => {
        const onboard = read('docs/ONBOARDING.md');
        expect(manifest.requiredLinks.length).toBeLessThanOrEqual(8);
        expect(manifest.requiredLinks.length).toBeGreaterThanOrEqual(6);
        for (const link of manifest.requiredLinks) {
            expect(existsSync(join(ROOT, link)), link).toBe(true);
            const name = basename(link);
            expect(onboard.includes(name) || onboard.includes(link), name).toBe(true);
        }
    });

    it('bootScripts exist in package.json', () => {
        for (const script of manifest.bootScripts) {
            expect(pkg.scripts[script], script).toBeTruthy();
        }
    });

    it('rubric claims Onboarding 8/10 with H10 and Human A+', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Onboarding docs[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H10\s*✅/);
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/\|\s*7 Onboarding docs\s*\|\s*~5\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
        expect(rubric).not.toMatch(/Human A\+[\s\S]*?not claimed/i);
    });
});
