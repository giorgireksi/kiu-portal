/**
 * Wave H7 — Safe edit surface (≥8/10): danger vs domain-local blast map.
 * CONTRACT: safe-edit-manifest lists high-fanout hubs as danger; paths exist; rubric claims H7.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function htmlFanout(relPath) {
    const needle = basename(relPath);
    let count = 0;
    for (const name of readdirSync(ROOT)) {
        if (!name.endsWith('.html')) continue;
        const src = read(name);
        if (src.includes(needle) || src.includes(relPath)) count += 1;
    }
    return count;
}

describe('Wave H7 safe edit surface', () => {
    const manifest = JSON.parse(read('tools/safe-edit-manifest.json'));

    it('docs and manifest exist with danger / caution / domain-local tiers', () => {
        expect(existsSync(join(ROOT, 'docs/js-safe-edit-surface.md'))).toBe(true);
        expect(read('docs/js-safe-edit-surface.md')).toContain('safe-edit-manifest.json');
        expect(read('docs/js-safe-edit-surface.md')).toMatch(/danger/i);
        expect(read('docs/human-maintainability.md')).toContain('js-safe-edit-surface.md');
        expect(manifest.danger.length).toBeGreaterThanOrEqual(manifest.minDanger || 8);
        expect(manifest.caution.length).toBeGreaterThanOrEqual(2);
        expect(manifest.domainLocalPatterns.length).toBeGreaterThanOrEqual(3);
    });

    it('every danger and caution path exists and carries an editRule', () => {
        const seen = new Set();
        for (const entry of [...manifest.danger, ...manifest.caution]) {
            expect(entry.path).toBeTruthy();
            expect(entry.editRule).toBeTruthy();
            expect(existsSync(join(ROOT, entry.path)), entry.path).toBe(true);
            expect(seen.has(entry.path), `duplicate ${entry.path}`).toBe(false);
            seen.add(entry.path);
        }
    });

    it('danger hubs meet htmlFanoutMin (portal-wide blast)', () => {
        for (const entry of manifest.danger) {
            const fanout = htmlFanout(entry.path);
            const min = entry.htmlFanoutMin || 10;
            expect(fanout, `${entry.path} fanout ${fanout} < ${min}`).toBeGreaterThanOrEqual(min);
        }
    });

    it('domainLocalPatterns are documented globs with editRules', () => {
        for (const pattern of manifest.domainLocalPatterns) {
            expect(pattern.id).toBeTruthy();
            expect(pattern.glob).toBeTruthy();
            expect(pattern.editRule).toBeTruthy();
        }
    });

    it('rubric claims Safe edit surface 8/10 with H7; Human A+ claimed via H10', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Safe edit surface[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H7\s*✅/);
        expect(rubric).toMatch(/H10\s*✅/);
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/\|\s*6 Safe edit surface\s*\|\s*~6\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
        expect(rubric).not.toMatch(/\|\s*7 Onboarding docs\s*\|\s*~5\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
    });
});
