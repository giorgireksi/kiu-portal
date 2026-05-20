import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('planner legacy delegation regressions', () => {
    it('keeps legacy scheduler and broad-calendar interactions on delegated hooks', () => {
        const plannerSource = readSource('assets/js/pages/planner.js');

        expect(plannerSource).toContain('function bindPlannerLegacyDelegates()');
        expect(plannerSource).toContain('function ensurePlannerLegacyInteractiveStyles()');
        expect(plannerSource).toContain('data-planner-grade-details="1"');
        expect(plannerSource).toContain('data-scheduler-open="1"');
        expect(plannerSource).toContain('data-scheduler-edit="1"');
        expect(plannerSource).toContain('data-scheduler-stats="1"');
        expect(plannerSource).toContain('data-scheduler-delete="1"');
        expect(plannerSource).toContain('data-bc-nav="-1"');
        expect(plannerSource).toContain('data-bc-year="${y}"');
        expect(plannerSource).toContain('data-bc-date="${dateStr}"');
        expect(plannerSource).toContain('data-bc-add="1"');
        expect(plannerSource).not.toContain('onclick="openSchedulerModal(');
        expect(plannerSource).not.toContain('onclick="event.stopPropagation(); openSchedulerEditModal(');
        expect(plannerSource).not.toContain('onclick="event.stopPropagation(); showSlotStats(');
        expect(plannerSource).not.toContain('onclick="event.stopPropagation(); deleteSection(');
        expect(plannerSource).not.toContain('onclick="bcNav(');
        expect(plannerSource).not.toContain('onclick="bcJumpYear(');
        expect(plannerSource).not.toContain('onclick="bcDayClick(');
        expect(plannerSource).not.toContain('onclick="bcAddEvent()');
        expect(plannerSource).not.toContain('onmouseenter="this.style.background=');
        expect(plannerSource).not.toContain("onmouseenter=\"this.style.boxShadow=");
        expect(plannerSource).not.toContain('onmouseleave="this.style.background=');
        expect(plannerSource).not.toContain("onmouseleave=\"this.style.boxShadow=");
        expect(plannerSource).toContain('Grade Details');
        expect(plannerSource).toContain('<tr><th>Midterm</th><th>Final</th><th>Homework</th><th>Quiz</th></tr>');
        expect(plannerSource).toContain("const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];");
        expect(plannerSource).not.toMatch(/Ã|â€”|ï¿½/);
    });
});
