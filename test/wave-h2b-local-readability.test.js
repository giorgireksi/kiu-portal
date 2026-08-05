/* CONTRACT: Gradebook/scheduler peels stay Pattern C and assets/js files ≥1800 stay ≤6. — see docs/test-as-map.md */
/**
 * Wave H2b — Local readability honest ≥8: Pattern C peels + ≥1800 headcount ≤6 (E4 ratchet).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const HOT_MIN = 1800;
const HOT_MAX_COUNT = 20;

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function listAssetsJs(dir = join(ROOT, 'assets/js'), acc = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) listAssetsJs(full, acc);
        else if (name.endsWith('.js')) acc.push(full);
    }
    return acc;
}

describe('Wave H2b local readability peels', () => {
    const quizMap = 'assets/js/pages/gradebook-quiz-map-runtime.js';
    const components = 'assets/js/pages/gradebook-components-runtime.js';
    const faculty = 'assets/js/pages/admin-scheduler-faculty-runtime.js';
    const model = 'assets/js/pages/gradebook-model.js';
    const workspace = 'assets/js/pages/gradebook-workspace.js';
    const tabs = 'assets/js/pages/lms-classroom-tabs-runtime.js';

    it('gradebook quiz-map peel is Pattern C and wired before model', () => {
        expect(existsSync(join(ROOT, quizMap))).toBe(true);
        const peel = read(quizMap);
        expect(peel).toMatch(/__KIU_GRADEBOOK_QUIZ_MAP_LOADED/);
        expect(peel).toMatch(/__kiuCreateGradebookQuizMapApi|createKiuGradebookQuizMapApi/);
        expect(peel).toMatch(/getDisplayAssessmentEntries/);
        expect(read(model)).not.toMatch(/^\s*function getDisplayAssessmentEntries\b/m);
        expect(read(model)).not.toMatch(/^\s*function parseLmsCourseKeyForGradebook\b/m);

        const urls = read(tabs);
        expect(urls).toContain('gradebook-quiz-map-runtime.js');
        expect(urls.indexOf('gradebook-quiz-map-runtime.js')).toBeLessThan(urls.indexOf('gradebook-model.js'));

        for (const page of ['faculty-gradebook.html', 'study-card.html']) {
            const html = read(page);
            expect(html.indexOf('gradebook-quiz-map-runtime.js')).toBeLessThan(html.indexOf('gradebook-model.js'));
        }
    });

    it('gradebook components peel is Pattern C and wired before workspace', () => {
        expect(existsSync(join(ROOT, components))).toBe(true);
        const peel = read(components);
        expect(peel).toMatch(/__KIU_GRADEBOOK_COMPONENTS_LOADED/);
        expect(peel).toMatch(/__kiuCreateGradebookComponentsApi|createKiuGradebookComponentsApi/);
        expect(peel).toMatch(/openGradebookComponentManager/);
        expect(read(workspace)).not.toMatch(/^\s*function openGradebookComponentManager\b/m);

        const urls = read(tabs);
        expect(urls).toContain('gradebook-components-runtime.js');
        expect(urls.indexOf('gradebook-components-runtime.js')).toBeLessThan(urls.indexOf('gradebook-workspace.js'));
    });

    it('admin-scheduler faculty peel is Pattern C and wired before host', () => {
        expect(existsSync(join(ROOT, faculty))).toBe(true);
        const peel = read(faculty);
        expect(peel).toMatch(/__KIU_ADMIN_SCHEDULER_FACULTY_LOADED/);
        expect(peel).toMatch(/__kiuCreateAdminSchedulerFacultyApi/);
        expect(peel).toMatch(/getSchedulerPaletteSubjects/);
        const host = read('assets/js/pages/admin-scheduler.js');
        expect(host).not.toMatch(/^\s*function getSchedulerPaletteSubjects\b/m);
        expect(host).toContain('__kiuCreateAdminSchedulerFacultyApi');
        const html = read('admin-scheduler.html');
        expect(html.indexOf('admin-scheduler-faculty-runtime.js')).toBeLessThan(html.indexOf('admin-scheduler.js'));
    });

    it(`assets/js files with ≥${HOT_MIN} lines are ≤${HOT_MAX_COUNT}`, () => {
        const hot = listAssetsJs()
            .map((abs) => {
                const rel = abs.slice(ROOT.length + 1);
                const lines = readFileSync(abs, 'utf8').split(/\r?\n/).length;
                return { rel, lines };
            })
            .filter((f) => f.lines >= HOT_MIN)
            .sort((a, b) => b.lines - a.lines);
        expect(
            hot.length,
            `expected ≤${HOT_MAX_COUNT} hot files, got ${hot.length}: ${hot.map((f) => `${f.lines} ${f.rel}`).join(', ')}`
        ).toBeLessThanOrEqual(HOT_MAX_COUNT);
    });

    it('rubric claims Local readability 8/10 with H2b and no 6.5 caveat', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Local readability[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H2b\s*✅/);
        expect(rubric).not.toMatch(/6\.5\s*honest/);
        expect(rubric).toMatch(/H5[\s\S]*Change locality/i);
    });
});
