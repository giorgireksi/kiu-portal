import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home-dashboard-widget-data-runtime peel', () => {
    it('owns widget row adapters outside the plain chunk via factory', () => {
        const plain = readSource('assets/js/features/index-home-dashboard.plain.js');
        const peel = readSource('assets/js/features/home-dashboard-widget-data-runtime.js');
        expect(plain).not.toMatch(/^\s*function getGradeRecordOutcome\b/m);
        expect(plain).not.toMatch(/HOME_DEFAULT_WIDGET_GEOMETRY\s*=/);
        expect(peel).toContain('function getGradeRecordOutcome');
        expect(peel).toContain('HOME_DEFAULT_WIDGET_GEOMETRY');
        expect(peel).toContain('__kiuCreateHomeDashboardWidgetDataApi');
        expect(peel).toContain('__KIU_HOME_DASHBOARD_WIDGET_DATA_LOADED');
        expect(peel).toContain('Object.assign(window, api)');
    });

    it('loads before index-home-dashboard.js on index.html', () => {
        const html = readSource('index.html');
        expect(html.indexOf('home-dashboard-widget-data-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/features/index-home-dashboard.js'));
    });
});
