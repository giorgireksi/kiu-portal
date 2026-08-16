import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const read = (path) => readFileSync(path, 'utf8');

describe('LMS interaction flicker regressions', () => {
    it('does not replace unchanged messenger subtrees during realtime refresh', () => {
        const runtime = read('assets/js/pages/lms-interaction-messages-runtime.js');
        const announcements = read('assets/js/pages/lms-classroom-tabs-runtime.js');
        const css = read('assets/css/lux-page-bare-lite.css');
        expect(announcements).toContain('lms-announcement-card');
        expect(announcements).not.toContain('class="lms-interaction-thread"');
        expect(css).not.toContain('.lms-interaction-bubble');
        expect(runtime).toContain('function normalizeLmsInteractionMarkup(markup)');
        expect(runtime).toContain('function lmsInteractionMarkupMatches(element, markup)');
        expect(runtime).toContain('!lmsInteractionMarkupMatches(railHead, nextRailHeadMarkup)');
        expect(runtime).toContain('!lmsInteractionMarkupMatches(composeRail, composeMarkup)');
        expect(runtime).toContain('!lmsInteractionMarkupMatches(thread, nextThreadMarkup)');
        expect(runtime).toContain('kiu-lms-assembly-target');
        expect(runtime).not.toContain("['invite', 'user-plus', 'Invite']");
        expect(runtime).not.toContain("['settings', 'sliders', 'Settings']");
    });

    it('loads the flicker-safe interaction runtime on LMS', () => {
        const tabs = read('assets/js/pages/lms-classroom-tabs-runtime.js');
        const html = read('lms.html');
        expect(tabs).toContain('lms-interaction-messages-runtime.js?v=20260816-lmsannouncement1');
        expect(html).toContain('lms-classroom-tabs-runtime.js?v=20260816-lmsannouncement3');
    });
});
