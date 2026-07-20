import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

async function loadModel() {
    const href = pathToFileURL(join(process.cwd(), 'assets/js/pages/student-service-model.js')).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    const target = {};
    mod.installStudentServiceModel(target);
    return target;
}

describe('student-service-model', () => {
    let win;

    beforeEach(async () => {
        win = await loadModel();
    });

    it('exports pure helpers on install target', () => {
        expect(win.__KIU_STUDENT_SERVICE_MODEL_LOADED).toBe(true);
        expect(win.KiuStudentServiceModel).toBeTruthy();
        expect(typeof win.ssEscape).toBe('function');
        expect(typeof win.ssNowIso).toBe('function');
        expect(typeof win.buildStudentServiceDefaultMacros).toBe('function');
    });

    it('escapes HTML and formats relative time', () => {
        expect(win.ssEscape('<b>x</b>')).toContain('&lt;b&gt;');
        expect(win.ssClampText('a'.repeat(10), 8)).toMatch(/\.\.\.$/);
        const recent = new Date(Date.now() - thr_ms(2)).toISOString();
        expect(win.ssFormatRelativeTime(recent)).toMatch(/m ago|Just now|h ago/);
    });

    it('normalizes registration course ids from nested shapes', () => {
        expect(win.normalizeStudentServiceRegistrationCourseIds({
            courses: [{ courseId: 'CS101' }, { id: 'MATH200' }],
            selectedSubjects: ['CS101', 'PHY100']
        }).sort()).toEqual(['CS101', 'MATH200', 'PHY100']);
    });

    it('builds default macros and article fingerprints', () => {
        const macros = win.buildStudentServiceDefaultMacros();
        expect(macros.length).toBeGreaterThanOrEqual(5);
        expect(macros[0].message).toBeTruthy();
        expect(win.buildStudentServiceArticleFingerprint([
            { id: 'a', updatedAt: 't1' },
            { id: 'b', createdAt: 't2' }
        ])).toBe('a:t1,b:t2');
        expect(win.getStudentServicePageLabel('library')).toBe('Library');
    });

    it('is wired as ESM leaf + bridge before student-service.js', () => {
        const html = readFileSync(join(process.cwd(), 'student-service.html'), 'utf8');
        const main = readFileSync(join(process.cwd(), 'assets/js/pages/student-service.js'), 'utf8');
        const model = readFileSync(join(process.cwd(), 'assets/js/pages/student-service-model.js'), 'utf8');
        expect(model).toContain('export function installStudentServiceModel');
        expect(html).toContain('type="module"');
        expect(html).toContain('student-service-model.js');
        expect(html).toContain('student-service-model-bridge.js');
        expect(html.indexOf('student-service-model.js')).toBeLessThan(html.indexOf('student-service-model-bridge.js'));
        expect(html.indexOf('student-service-model-bridge.js')).toBeLessThan(html.indexOf('student-service.js'));
        expect(main).toContain('student-service-model.js');
        expect(main).not.toMatch(/^function ssEscape\b/m);
        expect(main).not.toMatch(/^function buildStudentServiceDefaultMacros\b/m);
    });
});

function thr_ms(minutes) {
    return minutes * 60000;
}
