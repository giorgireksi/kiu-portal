import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('calendar ui regressions', () => {
    it('keeps the shared calendar workspace on delegated tab, month-nav, and modal actions', () => {
        const uiSource = readSource('assets/js/features/ui.js');

        expect(uiSource).toContain('function bindCalendarDelegates(root)');
        expect(uiSource).toContain("data-cal-tab=\"cal\"");
        expect(uiSource).toContain("data-cal-nav=\"-1\"");
        expect(uiSource).toContain("data-cal-modal-kind=\"announcement\"");
        expect(uiSource).toContain("data-cal-modal-kind=\"event\"");
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
    });
});
