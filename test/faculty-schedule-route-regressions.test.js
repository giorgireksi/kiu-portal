import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('faculty schedule route regressions', () => {
    it('keeps faculty-schedule as a zero-runtime alias to timetable.html', () => {
        const html = readSource('faculty-schedule.html');
        const navigationJs = readSource('assets/js/features/navigation.js');
        const stateJs = readSource('assets/js/app/state.js');

        expect(navigationJs).toContain("'faculty-schedule': 'faculty-schedule.html'");
        expect(stateJs).toContain("'faculty-schedule'");
        expect(stateJs).toContain("'timetable'");
        expect(html).toContain('url=timetable.html');
        expect(html).toContain("window.location.replace('timetable.html');");
        expect((html.match(/<script\b(?![^>]*\bsrc=)[^>]*>/gi) || [])).toHaveLength(1);
        expect((html.match(/<script\b[^>]*\bsrc=/gi) || [])).toHaveLength(0);
        expect((html.match(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi) || [])).toHaveLength(5);
        expect(html).not.toContain('assets/js/');
        expect(html).toContain('assets/css/lux-tokens.css');
        expect(html).toContain('assets/css/lux-surfaces.css');
        expect(html).toContain('assets/css/lux-controls.css');
        expect(html).toContain('assets/css/lux-layout-primitives.css');
        expect(html).toContain('assets/css/redirect-route.css');
        expect(html).not.toContain('lux-unified-shell');
        expect(html).not.toContain('kiu-shell-loading');
        expect(html).not.toContain('id=\"prof-nav\"');
        expect(html).not.toContain('mobile-bottom-nav');
    });
});
