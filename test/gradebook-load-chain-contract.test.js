/* CONTRACT: Gradebook peels/hosts load in one shared order (MODULE_URLS = helper = eager HTML). — see docs/test-as-map.md */
/**
 * Gradebook load-chain product contract (indexed by Wave H8 test-as-map).
 */
import { readFileSync } from 'node:fs';
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

describe('gradebook load-chain contract', () => {
    it('shared helper paths equal LMS_GRADEBOOK_MODULE_URLS', () => {
        const urls = parseLmsGradebookModuleUrls(read('assets/js/pages/lms-classroom-tabs-runtime.js'));
        expect(GRADEBOOK_MODULE_PATHS).toEqual(urls);
    });

    

});
