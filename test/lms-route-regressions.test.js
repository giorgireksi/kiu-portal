import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { expectLmsRouteCssLinks, expectRetiredLmsRouteCssGone } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('lms route regressions (retired skins purged)', () => {
    it('lms.html uses shared bare stack without retired route skins', () => {
        expectRetiredLmsRouteCssGone();
        expectLmsRouteCssLinks(read('lms.html'));
        expect(existsSync(join(process.cwd(), 'assets/css/lms-route.css'))).toBe(false);
    });

    it('marks layout-only shells and glass-root hosts per stage', () => {
        const html = read('lms.html');
        expect(html.match(/data-lux-layout-only="1"/g)).toHaveLength(3);
        expect(html).toMatch(/lms-route-panel-pad-16-20[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/lms-route-workspace-chrome[\s\S]*data-lux-glass-root="1"/);
    });
});
