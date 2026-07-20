/* CONTRACT: Every findability feature has ≤2 owners reachable from its HTML or lazy host. — see docs/test-as-map.md */
/**
 * Wave H1 — Human findability (≥8/10): feature → owner → HTML/lazy host.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function loadManifest() {
    return JSON.parse(read('tools/findability-manifest.json'));
}

function ownerReachable(ownerPath, htmlRel, lazyFrom = []) {
    const needle = basename(ownerPath);
    const html = read(htmlRel);
    if (html.includes(needle)) return true;
    for (const host of lazyFrom) {
        if (read(host).includes(needle)) return true;
    }
    // Chunk self-reference: loader lists the plain chunk
    if (lazyFrom.length === 0 && html.includes(needle)) return true;
    return false;
}

describe('Wave H1 findability', () => {
    const manifest = loadManifest();

    it('manifest has enough features and valid shape', () => {
        const features = manifest.routes.flatMap((r) => r.features);
        expect(features.length).toBeGreaterThanOrEqual(manifest.minFeatures || 40);
        for (const route of manifest.routes) {
            expect(route.html).toBeTruthy();
            expect(existsSync(join(ROOT, route.html))).toBe(true);
            if (route.archDoc) {
                expect(existsSync(join(ROOT, route.archDoc))).toBe(true);
            }
            for (const feature of route.features) {
                expect(feature.id).toMatch(/^[a-z0-9]+(\.[a-z0-9-]+)+$/);
                expect(feature.owners.length).toBeGreaterThanOrEqual(1);
                expect(feature.owners.length).toBeLessThanOrEqual(2);
                if (Array.isArray(feature.support)) {
                    for (const support of feature.support) {
                        expect(existsSync(join(ROOT, support)), `support missing: ${support}`).toBe(true);
                    }
                }
            }
        }
    });

    it('every owner file exists and is reachable from HTML or lazyFrom host', () => {
        for (const route of manifest.routes) {
            for (const feature of route.features) {
                const lazyFrom = feature.lazyFrom || [];
                for (const host of lazyFrom) {
                    expect(existsSync(join(ROOT, host)), `lazyFrom missing: ${host}`).toBe(true);
                }
                for (const owner of feature.owners) {
                    expect(existsSync(join(ROOT, owner)), `owner missing: ${owner}`).toBe(true);
                    const ok = ownerReachable(owner, route.html, lazyFrom);
                    expect(
                        ok,
                        `${feature.id}: ${owner} not in ${route.html} or lazyFrom ${lazyFrom.join(', ')}`
                    ).toBe(true);
                }
            }
        }
    });

    it('findability-index.md lists every feature id', () => {
        const index = read('docs/findability-index.md');
        for (const route of manifest.routes) {
            expect(index).toContain(`## ${route.id}`);
            for (const feature of route.features) {
                expect(index).toContain(feature.id);
            }
        }
    });

    it('route hubs carry FINDABILITY banners', () => {
        const hubs = [
            'assets/js/pages/social-page.js',
            'assets/js/pages/lms.js',
            'assets/js/pages/lms-classroom-tabs-runtime.js',
            'assets/js/pages/student-service.js',
            'assets/js/pages/student-registration.js',
            'assets/js/features/index-luxury.js',
            'assets/js/features/index-home-dashboard.js',
            'assets/js/pages/news.js'
        ];
        for (const hub of hubs) {
            expect(read(hub)).toMatch(/FINDABILITY:/);
        }
    });

    it('rubric claims Findability 8/10 and H1 done', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Findability[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H1\s*✅/);
        expect(rubric).toContain('findability-index.md');
    });
});
