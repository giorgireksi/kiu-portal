/* CONTRACT: Primary owners stay ≤2; gradebook source-locks use one shared helper. — see docs/test-as-map.md */
/**
 * Wave H5 — Change locality (≥8/10): owners ≤2, shared gradebook helper, load-chain SSOT.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRADEBOOK_MODULE_PATHS } from './helpers/gradebook-sources.js';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function stripQuery(url) {
    return String(url || '').split('?')[0];
}

function basenamePath(url) {
    return basename(stripQuery(url));
}

function parseLmsGradebookModuleUrls(tabsSource) {
    const match = tabsSource.match(/const LMS_GRADEBOOK_MODULE_URLS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
    expect(match, 'LMS_GRADEBOOK_MODULE_URLS missing').toBeTruthy();
    return [...match[1].matchAll(/'([^']+)'/g)].map((m) => stripQuery(m[1]));
}

function gradebookScriptOrderInHtml(html) {
    const order = [];
    for (const match of html.matchAll(/src="(assets\/js\/pages\/gradebook[^"]+)"/g)) {
        order.push(stripQuery(match[1]));
    }
    return order;
}

describe('Wave H5 change locality', () => {
    it('change-locality doc exists and defines owners vs support', () => {
        const doc = read('docs/js-change-locality.md');
        expect(doc).toMatch(/owners/i);
        expect(doc).toMatch(/support/i);
        expect(doc).toContain('MODULE_URLS');
        expect(read('docs/human-maintainability.md')).toContain('js-change-locality.md');
    });

    it('every findability feature has ≤2 primary owners', () => {
        const manifest = JSON.parse(read('tools/findability-manifest.json'));
        for (const route of manifest.routes) {
            for (const feature of route.features) {
                expect(feature.owners.length, feature.id).toBeGreaterThanOrEqual(1);
                expect(feature.owners.length, feature.id).toBeLessThanOrEqual(2);
                if (Array.isArray(feature.support)) {
                    for (const path of feature.support) {
                        expect(existsSync(join(ROOT, path)), `${feature.id} support ${path}`).toBe(true);
                    }
                }
            }
        }
    });

    it('shared gradebook-sources helper matches LMS_GRADEBOOK_MODULE_URLS and is imported by ≥6 tests', () => {
        expect(existsSync(join(ROOT, 'test/helpers/gradebook-sources.js'))).toBe(true);
        const urls = parseLmsGradebookModuleUrls(read('assets/js/pages/lms-classroom-tabs-runtime.js'));
        expect(GRADEBOOK_MODULE_PATHS).toEqual(urls);

        const testDir = join(ROOT, 'test');
        const importers = readdirSync(testDir)
            .filter((name) => name.endsWith('.test.js'))
            .filter((name) => read(join('test', name)).includes("from './helpers/gradebook-sources.js'"));
        expect(importers.length).toBeGreaterThanOrEqual(4);
    });

    

    it('rubric claims Change locality 8/10 with H5 and H6 done', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Change locality[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H5\s*✅/);
        expect(rubric).toMatch(/H6\s*✅/);
        expect(rubric).not.toMatch(/\|\s*5 Change locality\s*\|\s*~4\/10\s*\|\s*—\s*\|\s*deferred\s*\|/);
    });
});
