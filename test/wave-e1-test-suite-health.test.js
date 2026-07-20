/**
 * CONTRACT: Wave E1 — Test suite health ≥8: naming gate green, no 8-line purge stubs, quiz split current, queue doc.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

const PURGE_STAFF_STUBS = [
    'test/staff-form-field-remove.test.js',
    'test/staff-blueprint-step-seed.test.js',
    'test/staff-form-launch-buttons.test.js',
    'test/staff-form-modal-polish.test.js',
    'test/staff-form-studio-type-menu.test.js',
    'test/staff-profile-blueprint-view.test.js',
    'test/staff-profile-section-tabs.test.js',
];

describe('Wave E1 test suite health', () => {
    it('queue doc claims E1 done and lists E2–E6', () => {
        expect(existsSync(join(ROOT, 'docs/engineering-band-queue.md'))).toBe(true);
        const doc = read('docs/engineering-band-queue.md');
        expect(doc).toMatch(/E1\s*✅/);
        expect(doc).toContain('Test suite health');
        expect(doc).toContain('E2');
        expect(doc).toContain('Shared-hub isolation');
        expect(doc).toContain('E6');
        expect(read('docs/engineering-a-plus-frontend-js.md')).toContain('engineering-band-queue.md');
    });

    it('naming gate no longer asserts stale ~6.5 honest', () => {
        const naming = read('test/wave-h4-naming-patterns.test.js');
        expect(naming).not.toMatch(/~?6\.5\s+honest/);
        expect(naming).toMatch(/8\/10/);
    });

    it('former purge staff stubs are real suites (>8 lines, live owner lock)', () => {
        for (const rel of PURGE_STAFF_STUBS) {
            const source = read(rel);
            const lines = source.split('\n').length;
            expect(lines, rel).toBeGreaterThan(8);
            expect(source, rel).not.toMatch(/readArchivedStaffCss|_archive\//);
            expect(source, rel).toMatch(/assets\/js\/|staff\.html/);
            expect(source, rel).toMatch(/retired|expectRetiredCss/);
        }
    });

    it('quiz workspace module-split locks current peels, not retired CSS', () => {
        const quiz = read('test/lms-quiz-workspace-module-split.test.js');
        expect(quiz).toContain('LMS_QUIZ_MODULE_URLS');
        expect(quiz).toContain('lms-quiz-workspace-session-runtime.js');
        expect(quiz).toContain('lms-quiz-focus-runtime.js');
        expect(quiz).toMatch(/lms-route\.css[\s\S]*toBe\(false\)|existsSync[\s\S]*lms-route\.css[\s\S]*false/);
    });
});
