/**
 * Wave H6 — Dead / archive noise (≥8/10): live CSS path clear; archive tree purged.
 * CONTRACT: No assets/css/_archive tree; production HTML never href-links _archive/; retired basenames stay gone.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RETIRED_LMS_ROUTE_CSS } from './helpers/lms-route-css.js';
import { RETIRED_ROUTE_CSS } from './helpers/bare-shell-css.js';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave H6 archive noise (purged)', () => {
    it('docs describe live CSS and purged archive (do not reintroduce)', () => {
        expect(existsSync(join(ROOT, 'docs/active-vs-archive.md'))).toBe(true);
        const doc = read('docs/active-vs-archive.md');
        expect(doc).toMatch(/purged|removed|do not reintroduce/i);
        expect(doc).toContain('assets/css');
        expect(existsSync(join(ROOT, 'assets/css/_archive'))).toBe(false);
    });

    it('retired route skins stay absent from live assets/css/', () => {
        const names = new Set([...RETIRED_ROUTE_CSS, ...RETIRED_LMS_ROUTE_CSS]);
        for (const name of names) {
            expect(existsSync(join(ROOT, 'assets/css', name)), name).toBe(false);
        }
    });

    it('no production HTML href links into _archive/', () => {
        const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
        expect(htmlFiles.length).toBeGreaterThan(10);
        for (const name of htmlFiles) {
            const html = read(name);
            expect(html, name).not.toMatch(/href=["'][^"']*_archive\//);
        }
    });

    it('rubric claims Dead/archive 8/10 with H6; Human A+ claimed', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Dead\s*\/\s*archive noise[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H6\s*✅/);
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/\|\s*10 Dead \/ archive noise\s*\|\s*~5\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
    });
});
