import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS assignments week accordion regressions', () => {
    it('replaces legacy accordion markup with week panels that respect LMS transparency', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const sectionQuizSource = readSource('assets/js/pages/lms-section-quiz-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const assignmentsSource = readSource('assets/js/pages/lms-assignments-runtime.js');
        const bareLite = readSource('assets/css/lux-page-bare-lite.css');

        expect(sectionQuizSource).toContain('lms-week-accordion-panel');
        expect(sectionQuizSource).toContain('lms-week-accordion-head');
        expect(sectionQuizSource).toContain('lms-week-accordion-body');
        expect(assignmentsSource).not.toContain('class="accordion-item"');
        expect(assignmentsSource).not.toContain('class="accordion-header"');

        expect(sectionQuizSource).toContain('lms-week-accordion-panel home-hover-chip');
        expect(sectionQuizSource).toContain('lms-route-stat home-hover-chip');

        expect(classroomSource).toContain("empty.closest('.lms-week-accordion-body, .lms-week-accordion-empty')");
        expect(classroomSource).toContain("card.classList.contains('lms-week-accordion-panel')");
        expect(classroomSource).toContain("'.lms-route-card:not(.lms-week-accordion-panel), .lms-call-classroom'");
        expect(classroomSource).toContain("el.classList.add('home-hover-chip')");

        expect(sectionQuizSource).toContain('function renderLmsWeekPanelEmptyState(title, copy, icon');
        expect(sectionQuizSource).toContain('lms-route-empty--week-panel');
        expect(lmsSource).toContain('const renderLmsWeekPanelEmptyState = window.renderLmsWeekPanelEmptyState');
        expect(assignmentsSource).toContain('renderLmsWeekPanelEmptyState(');
        expect(assignmentsSource).toContain('lms-assignment-banner');

        expect(bareLite).toContain('body.lux-route-lms .lms-week-accordion-panel');
        expect(classroomSource).toContain("'lms-week-accordion-panel'");
    });

    it('uses shared bare-lite layout for assignment workspace surfaces', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-workspace');
        expect(bare).toContain('body.lux-route-lms .lms-week-accordion-head');
        expect(bare).toContain('body.lux-route-lms .lms-route-empty--week-panel');
        expect(bare).toContain('body.lux-route-lms .lms-assignment-student-detail-grid');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lms-route-file-shell,');
        expect(fouc).toContain('.lms-assignment-rubric-shell,');
        expect(bare).not.toMatch(/body\.lux-route-lms \.lms-route-file-shell[\s\S]{0,120}background:\s*rgba/);
        expect(bare).not.toMatch(/body\.lux-route-lms \.lms-assignment-rubric-shell[\s\S]{0,120}background:\s*rgba/);
        expect(bare).toContain('body.lux-route-lms .lms-route-file-shell-title');
    });
});