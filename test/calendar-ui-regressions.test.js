import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('calendar ui regressions', () => {
    it('keeps the shared calendar workspace on delegated tab, month-nav, and modal actions', () => {
        const uiSource = readSource('assets/js/features/ui.js');
        const cssSource = readSource('assets/css/index-luxury.css');

        expect(uiSource).toContain('function bindCalendarDelegates(root)');
        expect(uiSource).toContain("data-cal-tab=\"cal\"");
        expect(uiSource).toContain("data-cal-nav=\"-1\"");
        expect(uiSource).toContain("data-cal-modal-kind=\"announcement\"");
        expect(uiSource).toContain("data-cal-modal-kind=\"event\"");
        expect(uiSource).toContain('contentEl.hidden = t !== tab;');
        expect(uiSource).toContain('class="page-hero"');
        expect(uiSource).toContain('class="tabs-container"');
        expect(uiSource).toContain('class="content-box"');
        expect(uiSource).toContain('class="kiu-table"');
        expect(uiSource).toContain('class="lux-calendar-board"');
        expect(uiSource).toContain('class="lux-calendar-nav"');
        expect(uiSource).toContain('class="lux-calendar-heading"');
        expect(uiSource).toContain('class="lux-calendar-cell is-empty"');
        expect(uiSource).toContain('class="lux-calendar-event"');
        expect(uiSource).toContain('function encodeCalendarModalPayload(value)');
        expect(uiSource).toContain('function decodeCalendarModalPayload(value)');
        expect(uiSource).not.toContain(`onclick="window._calNav(-1)"`);
        expect(uiSource).not.toContain(`onclick="window._calNav(1)"`);
        expect(uiSource).not.toContain(`onclick="switchCalendarTab('cal')"`);
        expect(uiSource).not.toContain(`onclick="switchCalendarTab('announcements')"`);
        expect(uiSource).not.toContain(`onclick="switchCalendarTab('events')"`);
        expect(uiSource).not.toContain(`onclick="switchCalendarTab('officehours')"`);
        expect(uiSource).not.toContain(`onclick="openModal('announcement'`);
        expect(uiSource).not.toContain(`onclick="openModal('event'`);
        expect(uiSource).not.toContain('style="display:none;"');
        expect(uiSource).toContain('id="cal-content-announcements" hidden');
        expect(uiSource).toContain('id="cal-content-events" hidden');
        expect(uiSource).toContain('id="cal-content-officehours" hidden');
        expect(cssSource).toContain('.lux-calendar-board');
        expect(cssSource).toContain('.lux-calendar-nav');
        expect(cssSource).toContain('.lux-calendar-heading');
        expect(cssSource).toContain('.lux-calendar-title');
        expect(cssSource).toContain('.lux-calendar-subtitle');
        expect(cssSource).toContain('.calendar-action-btn');
        expect(cssSource).toContain('.calendar-empty-cell');
    });
});
