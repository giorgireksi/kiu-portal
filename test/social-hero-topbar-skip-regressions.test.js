import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const HERO_PANELS = [
    'feed',
    'community',
    'groups',
    'workspace',
    'projects',
    'events',
    'lost-and-found',
];

const INBOX_PANELS = ['messages', 'alerts', 'pages'];

describe('social hero topbar skip regressions', () => {
    it('skips shell topbar and command for all hero and inbox panels', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        expect(source).toContain('const SOCIAL_TOPBAR_SKIPPED_PANELS = new Set([');
        expect(source).toContain('function isSocialTopbarSkippedPanel(');
        expect(source).toContain("if (isSocialTopbarSkippedPanel(activePanel)) return '';");
        expect(source).toContain('if (isSocialTopbarSkippedPanel(activePanel)) {');
        expect(source).toContain('} else if (isSocialTopbarSkippedPanel(activePanel)) {');
        expect(source).toContain("setSocialRegionMarkup(shell.topbar, '')");
        expect(source).toContain("setSocialRegionMarkup(shell.command, '')");

        for (const panel of [...HERO_PANELS, ...INBOX_PANELS]) {
            expect(source).toContain(`'${panel}'`);
        }

        const renderContextTabsStart = source.indexOf('function renderContextTabs(activePanel)');
        const renderContextTabsEnd = source.indexOf('function renderSectionCommandCenter', renderContextTabsStart);
        const renderContextTabsBlock = source.slice(renderContextTabsStart, renderContextTabsEnd);
        expect(renderContextTabsBlock).toContain("activePanel === 'groups'\n                ? []");

        for (const panel of HERO_PANELS) {
            expect(css).toContain(`body.lux-route-social .social-neo[data-panel="${panel}"] #social-neo-topbar-region`);
            expect(css).toMatch(
                new RegExp(
                    `\\[data-panel="${panel}"\\][\\s\\S]*#social-neo-topbar-region[\\s\\S]*display:\\s*none`
                )
            );
            expect(css).toMatch(
                new RegExp(
                    `\\[data-panel="${panel}"\\][\\s\\S]*#social-neo-command-region[\\s\\S]*display:\\s*none`
                )
            );
        }

        for (const panel of INBOX_PANELS) {
            expect(css).toContain(`body.lux-route-social .social-neo[data-panel="${panel}"] #social-neo-topbar-region`);
        }

        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
    });
});