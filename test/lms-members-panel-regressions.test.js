import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS members panel regressions', () => {
    it('uses compact member rows instead of kv cards', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const membersBlock = classroomSource.match(/function renderLmsMembersSection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(membersBlock).toContain('const buildMemberRow =');
        expect(membersBlock).toContain('class="lms-member-row"');
        expect(membersBlock).toContain('class="lms-member-row-list"');
        expect(membersBlock).toContain('class="lms-member-section"');
        expect(membersBlock).not.toContain('lms-member-card-kv-grid');
        expect(membersBlock).not.toContain("renderLmsRouteKv('Faculty'");
    });

    it('styles compact member rows and slim overview panel', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-lms .lms-member-stack');
        expect(bare).toContain('body.lux-route-lms .lms-member-row');
        expect(bare).toContain('body.lux-route-lms .lms-member-section');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-members');
        expect(bare).toContain('.lms-route-pill.is-you');
    });

    it('bumps members compact cache bust token in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(html).toContain('lmworkspace7');
    });
});
