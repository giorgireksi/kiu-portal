/**
 * Wave H3 — Dependency clarity (≥8/10): load-chain manifest + typeof window ratchet.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function loadManifest() {
    return JSON.parse(read('tools/dependency-manifest.json'));
}

function htmlScriptOrder(htmlRel) {
    const html = read(htmlRel);
    return [...html.matchAll(/src="(assets\/js\/[^"]+)"/g)].map((m) => m[1].split('?')[0]);
}

describe('Wave H3 dependency clarity', () => {
    const manifest = loadManifest();

    it('manifest routes/html exist and eager hubs appear in HTML in order', () => {
        expect(manifest.routes.length).toBeGreaterThanOrEqual(6);
        for (const route of manifest.routes) {
            expect(existsSync(join(ROOT, route.html)), route.html).toBe(true);
            const scripts = htmlScriptOrder(route.html);
            expect(route.eagerHubs.length).toBeGreaterThanOrEqual(3);
            let lastIdx = -1;
            for (const hub of route.eagerHubs) {
                expect(existsSync(join(ROOT, hub)), hub).toBe(true);
                const idx = scripts.indexOf(hub);
                expect(idx, `${route.id} missing ${hub}`).toBeGreaterThanOrEqual(0);
                expect(idx, `${route.id} order ${hub}`).toBeGreaterThan(lastIdx);
                lastIdx = idx;
            }
        }
    });

    it('lazy chain URLs exist and basenames appear in loader sources', () => {
        for (const route of manifest.routes) {
            for (const chain of route.lazyChains || []) {
                expect(existsSync(join(ROOT, chain.loader)), chain.loader).toBe(true);
                const loaderSrc = read(chain.loader);
                expect(chain.urls.length).toBeGreaterThanOrEqual(1);
                for (const url of chain.urls) {
                    expect(existsSync(join(ROOT, url)), url).toBe(true);
                    expect(loaderSrc.includes(basename(url)), `${chain.id} → ${url}`).toBe(true);
                }
            }
        }
    });

    it('dependency-index.md lists every route id', () => {
        const index = read('docs/dependency-index.md');
        for (const route of manifest.routes) {
            expect(index).toContain(`## ${route.id}`);
        }
    });

    it('TYPEOF_WINDOW_MAX ≤ 900 and ops uses ssForward helper', () => {
        const guard = read('tools/check-architecture-guardrails.js');
        const match = guard.match(/TYPEOF_WINDOW_MAX\s*=\s*(\d+)/);
        expect(match).toBeTruthy();
        expect(Number(match[1])).toBeLessThanOrEqual(900);
        const ops = read('assets/js/pages/student-service-ops-runtime.js');
        expect(ops).toContain('ssForwardToLoadedModule');
        expect(ops).not.toMatch(/\btypeof\s+window\.\w+/);
    });

    it('rubric claims Dependency clarity 8/10 and H3 done', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Dependency clarity[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H3\s*✅/);
        expect(rubric).toContain('dependency-index.md');
    });
});
