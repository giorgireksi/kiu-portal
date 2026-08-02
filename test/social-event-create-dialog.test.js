import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-event-create-dialog.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('event create dialog uses shared social-glass shell', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const createFormLine = events.split('\n').find((line) => line.includes('data-form="create-event"') && line.includes('<form'));
        expect(createFormLine).toBeTruthy();
        expect(createFormLine).toContain('lux-glass-dialog-card--social-glass');
        expect(createFormLine).not.toContain('social-neo-card');
    });

    it('event delete dialog uses shared social-glass compact shell', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const deleteFormLine = events.split('\n').find((line) => line.includes('data-form="dialog-event-delete"') && line.includes('<form'));
        expect(deleteFormLine).toBeTruthy();
        expect(deleteFormLine).toContain('lux-glass-dialog-card--social-glass');
        expect(deleteFormLine).toContain('lux-glass-dialog-card--compact');
        expect(deleteFormLine).toContain('data-lux-transparency-exempt="1"');
        expect(events).toContain('lux-glass-dialog-body');
    });

    it('online event toggle keeps URL field in DOM without dialog re-render', () => {
        const events = readSource('assets/js/pages/social-events.js');
        expect(events).toContain('name="eventOnlineLink"');
        expect(events).not.toMatch(/\$\{runtime\.ui\?\.eventIsOnline \? `[\s\S]*name="eventOnlineLink"/);
        const handlerBlock = events.split('function handleSocialEventsChange')[1]?.split('function ')[0] || '';
        const onlineHandler = handlerBlock.match(/\[name="eventIsOnline"\][\s\S]*?return;/);
        expect(onlineHandler).toBeTruthy();
        expect(onlineHandler[0]).not.toContain('renderSocialPageNow');
        expect(onlineHandler[0]).toContain('link.hidden');
    });
});
