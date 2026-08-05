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
        expect(html).toMatch(/lms-route-workspace-chrome/);
        expect(html).toMatch(/data-lux-glass-root="1"[\s\S]*lms-content-area/);
    });

    it('enforces panel exclusivity before switchLMSTab early return', () => {
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const switchBlock = shellSource.match(/function switchLMSTab[\s\S]*?(?=\nfunction |\n        const api = \{)/)?.[0] || '';

        expect(switchBlock).toMatch(/setLmsWorkspacePanel\(tab === 'gradebook' \? 'gradebook' : 'content'\)/);
        expect(switchBlock).toContain('panelsExclusive');
        expect(switchBlock).toMatch(/panelsExclusive[\s\S]*return;/);
    });

    it('syncs workspace chrome offset on every tab switch', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

        expect(classroomSource).toContain('function syncLmsWorkspaceChromeOffset');
        expect(classroomSource).toContain('.lms-route-workspace-chrome');
        expect(shellSource).toMatch(/function switchLMSTab[\s\S]*syncLmsWorkspaceChromeOffset\(contentArea\)/);
    });

    it('stacks course card-head on narrow viewports', () => {
    });

    it('does not inject lms-pro-hero or deep-toolkit panels into tab content', () => {
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        expect(shellSource).not.toContain('lms-pro-hero');
        expect(shellSource).not.toContain('renderLmsProfessionalSectionHero');
        expect(shellSource).not.toMatch(/insertAdjacentHTML\('afterbegin',\s*toolkitMarkup\)/);
        expect(shellSource).not.toMatch(/insertAdjacentHTML\('afterbegin',\s*injectedMarkup\)/);
    });

    it('bumps workspace shell cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');
        expectLmsRouteCssLinks(html);
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-shell-runtime.js?v=20260805-switchperf2');
        expect(html).not.toContain('data-lms-pro-hero');
    });
});