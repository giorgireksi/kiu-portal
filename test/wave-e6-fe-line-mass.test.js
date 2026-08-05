/**
 * CONTRACT: Wave E6 — FE line mass ≥8: never-loaded assets/js/portfolio/ gone; line-mass doc + E6 ✅.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const ASSETS_JS_MAX_FILES = 300;
const ASSETS_JS_MAX_LINES = 200000;

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function listJsFiles(dir, acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) listJsFiles(full, acc);
        else if (entry.name.endsWith('.js')) acc.push(full);
    }
    return acc;
}

function countLines(filePath) {
    return readFileSync(filePath, 'utf8').split(/\r?\n/).length;
}

describe('Wave E6 FE line mass', () => {
    it('docs + queue claim E6 / #18 ≥8', () => {
        expect(existsSync(join(ROOT, 'docs/js-fe-line-mass.md'))).toBe(true);
        expect(read('docs/js-fe-line-mass.md')).toContain('assets/js/portfolio');
        const queue = read('docs/engineering-band-queue.md');
        expect(queue).toMatch(/E6\s*✅/);
        expect(queue).toMatch(/FE line mass/);
        expect(read('docs/engineering-a-plus-frontend-js.md')).toMatch(/E6\s*✅/);
    });

    it('never-loaded assets/js/portfolio/ is absent', () => {
        expect(existsSync(join(ROOT, 'assets/js/portfolio'))).toBe(false);
        const assetsJs = listJsFiles(join(ROOT, 'assets/js'));
        for (const file of assetsJs) {
            const src = readFileSync(file, 'utf8');
            expect(src, file).not.toMatch(/window\.KiuPortfolioModel/);
            expect(src, file).not.toMatch(/global\.KiuPortfolioModel\s*=/);
        }
    });

    it(`assets/js stays ≤${ASSETS_JS_MAX_FILES} files and ≤${ASSETS_JS_MAX_LINES} lines`, () => {
        const files = listJsFiles(join(ROOT, 'assets/js'));
        const lines = files.reduce((sum, f) => sum + countLines(f), 0);
        expect(files.length).toBeLessThanOrEqual(ASSETS_JS_MAX_FILES);
        expect(lines).toBeLessThanOrEqual(ASSETS_JS_MAX_LINES);
        expect(statSync(join(ROOT, 'assets/js')).isDirectory()).toBe(true);
    });
});
