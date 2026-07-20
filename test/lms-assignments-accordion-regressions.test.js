import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS assignments week accordion regressions', () => {
    it('replaces legacy accordion markup with week panels that respect LMS transparency', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const assignmentsSource = readSource('assets/js/pages/lms-assignments-runtime.js');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        expect(lmsSource).toContain('lms-week-accordion-panel');
        expect(lmsSource).toContain('lms-week-accordion-head');
        expect(lmsSource).toContain('lms-week-accordion-body');
        expect(lmsSource).not.toContain('class="accordion-item"');
        expect(lmsSource).not.toContain('class="accordion-header"');

        expect(classroomSource).toContain("empty.closest('.lms-week-accordion-body, .lms-week-accordion-empty')");
        expect(classroomSource).toContain("card.classList.contains('lms-week-accordion-panel')");
        expect(classroomSource).toContain('element.closest(\'.lms-week-accordion-panel\')');

        expect(lmsSource).toContain('function renderLmsWeekPanelEmptyState(title, copy, icon');
        expect(lmsSource).toContain('lms-route-empty--week-panel');
        expect(assignmentsSource).toContain('renderLmsWeekPanelEmptyState(');
        expect(assignmentsSource).toContain('lms-assignment-banner');

        expect(utilitiesSource).toContain('#lms-content-area .lms-week-accordion-panel');
        expect(utilitiesSource).toContain("'lms-week-accordion-panel'");
    });
});