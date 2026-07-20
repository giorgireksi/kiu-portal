/**
 * Wave H9 — CSS/JS coupling + Backend seam clarity (≥8/10).
 * CONTRACT: css-route-manifest stays synced to visual-route-classification;
 * fe-backend-seam-manifest lists ≥12 real domain/route seams with live apiPrefix.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const require = createRequire(import.meta.url);

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function walkJsSnippets(dirs) {
    const chunks = [];
    for (const dir of dirs) {
        const abs = join(ROOT, dir);
        if (!existsSync(abs)) continue;
        const stack = [abs];
        while (stack.length) {
            const cur = stack.pop();
            for (const name of readdirSync(cur, { withFileTypes: true })) {
                const next = join(cur, name.name);
                if (name.isDirectory()) {
                    if (name.name === 'node_modules' || name.name === '_archive') continue;
                    stack.push(next);
                } else if (/\.(js|mjs|cjs)$/.test(name.name)) {
                    chunks.push(readFileSync(next, 'utf8'));
                }
            }
        }
    }
    return chunks.join('\n');
}

describe('Wave H9 CSS/JS coupling + backend seams', () => {
    const cssManifest = JSON.parse(read('tools/css-route-manifest.json'));
    const seamManifest = JSON.parse(read('tools/fe-backend-seam-manifest.json'));
    const { routeVisualClassification } = require('../tools/visual-route-classification.js');

    it('css coupling docs + manifest exist and point at classification', () => {
        expect(existsSync(join(ROOT, 'docs/css-js-coupling.md'))).toBe(true);
        expect(read('docs/css-js-coupling.md')).toContain('css-route-manifest.json');
        expect(read('docs/css-js-coupling.md')).toContain('visual-route-classification');
        expect(read('docs/human-maintainability.md')).toContain('css-js-coupling.md');
        expect(cssManifest.source).toContain('visual-route-classification');
        expect(Object.keys(cssManifest.routes).length).toBeGreaterThanOrEqual(20);
    });

    it('css-route-manifest keys and dedicatedCss stay synced to classification', () => {
        const manifestKeys = Object.keys(cssManifest.routes).sort();
        const classKeys = Object.keys(routeVisualClassification).sort();
        expect(manifestKeys).toEqual(classKeys);

        for (const html of classKeys) {
            const fromClass = routeVisualClassification[html];
            const fromManifest = cssManifest.routes[html];
            expect(fromManifest.category, html).toBe(fromClass.category);
            expect(fromManifest.dedicatedCss, html).toEqual(fromClass.dedicatedCss);
            expect(['shared-portal', 'index', 'auth', 'redirect', 'minimal']).toContain(fromManifest.stack);
        }
    });

    it('every dedicatedCss path exists and HTML references its basename', () => {
        for (const [html, meta] of Object.entries(cssManifest.routes)) {
            expect(existsSync(join(ROOT, html)), html).toBe(true);
            for (const cssPath of meta.dedicatedCss || []) {
                expect(existsSync(join(ROOT, cssPath)), `${html} → ${cssPath}`).toBe(true);
                const basename = cssPath.split('/').pop();
                const htmlSrc = read(html);
                expect(htmlSrc.includes(basename), `${html} missing ${basename}`).toBe(true);
            }
        }
    });

    it('fe-backend seams docs + ≥12 seams with real domain/routes paths', () => {
        expect(existsSync(join(ROOT, 'docs/fe-backend-seams.md'))).toBe(true);
        expect(read('docs/fe-backend-seams.md')).toContain('fe-backend-seam-manifest.json');
        expect(read('docs/human-maintainability.md')).toContain('fe-backend-seams.md');
        expect(seamManifest.seams.length).toBeGreaterThanOrEqual(seamManifest.minSeams || 12);
        expect(seamManifest.seams.length).toBeGreaterThanOrEqual(12);

        const seen = new Set();
        for (const seam of seamManifest.seams) {
            expect(seam.id).toBeTruthy();
            expect(seam.apiPrefix).toMatch(/^\/api\//);
            expect(existsSync(join(ROOT, seam.domain)), seam.domain).toBe(true);
            expect(existsSync(join(ROOT, seam.routes)), seam.routes).toBe(true);
            if (seam.feEntry) {
                expect(existsSync(join(ROOT, seam.feEntry)), seam.feEntry).toBe(true);
            }
            seen.add(seam.id);
        }
        expect(seen.size).toBe(seamManifest.seams.length);
    });

    it('every seam apiPrefix appears in FE or BE source', () => {
        const corpus = walkJsSnippets([
            'backend/platform',
            'assets/js',
            'tools'
        ]);
        for (const seam of seamManifest.seams) {
            expect(corpus.includes(seam.apiPrefix), seam.apiPrefix).toBe(true);
        }
    });

    it('rubric claims CSS/JS coupling and Backend seams 8/10 with H9; Human A+ claimed', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/CSS\/JS coupling[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/Backend seam clarity[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H9\s*✅/);
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/\|\s*11 CSS\/JS coupling\s*\|\s*~6\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
        expect(rubric).not.toMatch(/\|\s*12 Backend seam clarity\s*\|\s*~6\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
    });
});
