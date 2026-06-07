import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('faculty-gradebook route regressions', () => {
    it('keeps faculty-gradebook glass tokens aligned with utilities', () => {
        const css = readSource('assets/css/faculty-gradebook-route.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const html = readSource('faculty-gradebook.html');

        expect(html).toContain('assets/css/lms-route.css?v=20260531-fgvisual1');
        expect(html).toContain('assets/css/faculty-gradebook-route.css?v=20260531-fgvisual1');
        expect(html).toContain('assets/js/pages/gradebook.js?v=20260531-portalnav1');
        expect(html).toContain('assets/js/features/navigation.js?v=20260531-portalnav1');
        expect(html).toContain('lux-route-faculty-gradebook');
        expect(html).toContain('id="gradebook-faculty-staff-workspace"');
        expect(html).toContain('id="fs-filter-subject"');
        expect(html).toContain('id="fs-filter-group"');
        expect(html).toContain('initFacultyGradebookPage');
        expect(html).not.toContain('id="gradebook-body"');
        expect(html).not.toContain('lux-spreadsheet-view');
        expect(css).toContain('--fg-fade-surface');
        expect(css).toContain('--fg-fade-surface-soft');
        expect(css).toContain('--fg-fade-control');
        expect(css).toContain('--fg-fade-chip');
        expect(css).toContain('--fg-fade-row');
        expect(css).toContain('--fg-fade-modal');
        expect(css).toContain('Panel shells');
        expect(css).toContain('Soft chrome lock-in');
        expect(css).toContain('background: var(--fg-fade-surface) !important');
        expect(css).toContain('background: var(--fg-fade-surface-soft) !important');
        expect(css).toContain('html.lux-high-transparency body.lux-route-faculty-gradebook');
        expect(css).not.toContain('html.lux-high-transparency.lux-high-transparency.lux-high-transparency');
        expect(css).not.toContain('--faculty-gradebook-glass-bg');

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-faculty-gradebook')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-faculty-command')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-faculty-insight')");
        expect(utilitiesSource).toContain("className.startsWith('gb-')");
        expect(utilitiesSource).not.toMatch(
            /\/\/ Faculty\/Gradebook elements[\s\S]*?\.lux-faculty-command', '\.lux-faculty-insight', '\.lux-faculty-stage'/
        );

        expect(css).toContain('.lux-faculty-insight-grid');
        expect(css).toContain('display: none');
        const lmsCss = readSource('assets/css/lms-route.css');
        expect(lmsCss).toContain('body.lux-route-faculty-gradebook .gb-lms-staff-roster-row');
        expect(lmsCss).toContain('body.lux-route-faculty-gradebook .gb-score-history-row');
        expect(lmsCss).toContain('.gb-lms-staff-roster-foot');
        expect(lmsCss).toContain('.gb-lms-staff-score-stat');
    });

    it('wires faculty aggregate roster and staff modern gradebook in gradebook.js', () => {
        const gradebook = readSource('assets/js/pages/gradebook.js');
        expect(gradebook).toContain('function isFacultyStandaloneGradebookContext()');
        expect(gradebook).toContain('function isStaffModernGradebookContext()');
        expect(gradebook).toContain('function buildFacultyGradebookAggregateRoster(');
        expect(gradebook).toContain('function initFacultyGradebookPage()');
        expect(gradebook).toContain('function initStaffModernGradebook()');
        expect(gradebook).toContain('function persistStudentEvaluationEntryOnRoster(');
        expect(gradebook).toContain('resolveFacultyGradebookRosterKeysForStudent');
        expect(gradebook).toContain('getStaffModernGradebookRoot');
        expect(gradebook).toContain('gb-lms-staff-roster-foot');
        expect(gradebook).toContain('gb-lms-staff-score-stat');
        expect(gradebook).toContain('toggle-score-history');
        expect(gradebook).toContain('gb-score-history-count');
    });
});
