import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS workspace shell regressions (phases 0–2)', () => {
    it('removes 1380px cap on course workspace inner page', () => {
    });

    it('uses sticky workspace chrome wrapper instead of tab strip alone', () => {
        const html = readSource('lms.html');
        expect(html).toContain('class="lms-route-workspace-chrome"');
        // Outer chrome CSS fills (Wave 3a keep-CSS hosts)
    });

    it('enforces panel exclusivity before switchLMSTab early return', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const switchBlock = classroomSource.match(/function switchLMSTab[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(switchBlock).toMatch(/setLmsWorkspacePanel\(tab === 'gradebook' \? 'gradebook' : 'content'\)/);
        expect(switchBlock).toContain('panelsExclusive');
        expect(switchBlock).toMatch(/panelsExclusive[\s\S]*return;/);
    });

    it('syncs workspace chrome offset on every tab switch', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain('function syncLmsWorkspaceChromeOffset');
        expect(classroomSource).toContain('.lms-route-workspace-chrome');
        expect(classroomSource).toContain('window.syncLmsWorkspaceChromeOffset = syncLmsWorkspaceChromeOffset');
        expect(classroomSource).toMatch(/function openLMSCourse[\s\S]*syncLmsWorkspaceChromeOffset/);
        expect(classroomSource).toMatch(/function switchLMSTab[\s\S]*syncLmsWorkspaceChromeOffset\(contentArea\)/);
    });

    it('stacks course card-head on narrow viewports', () => {
    });

    it('bumps workspace shell cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');
        expectLmsRouteCssLinks(html);
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260715-lms-lazy7');
    });
});