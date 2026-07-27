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
});
