/**
 * CONTRACT: Wave E2 — Shared-hub isolation ≥8: admin merge peel out of api.js; AdminQuiz/Exam growth frozen in state.js; isolation doc.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave E2 shared-hub isolation', () => {
    it('isolation doc + queue claim E2 / #21 ≥8', () => {
        expect(existsSync(join(ROOT, 'docs/js-shared-hub-isolation.md'))).toBe(true);
        const isolation = read('docs/js-shared-hub-isolation.md');
        expect(isolation).toContain('api-admin-merge-runtime.js');
        expect(isolation).toContain('safe-edit-manifest.json');
        expect(read('docs/js-safe-edit-surface.md')).toContain('js-shared-hub-isolation.md');

        const queue = read('docs/engineering-band-queue.md');
        expect(queue).toMatch(/E2\s*✅/);
        expect(queue).toMatch(/Shared-hub isolation[\s\S]*?\*\*≥8\*\*|21[\s\S]*?\*\*≥8\*\*/);
        expect(read('docs/engineering-a-plus-frontend-js.md')).toMatch(/E2\s*✅|shared-hub isolation/);
    });

    it('api-admin-merge peel owns merge helpers; host only binds window APIs', () => {
        const peel = read('assets/js/app/api-admin-merge-runtime.js');
        const host = read('assets/js/app/api.js');

        expect(peel).toContain('__KIU_API_ADMIN_MERGE_LOADED');
        expect(peel).toContain('__kiuCreateApiAdminMergeApi');
        expect(peel).toContain('function mergeAdminLibraryState');
        expect(peel).toContain('function mergeRegistrationCmsStateFromLocal');

        expect(host).toContain('const mergeAdminLibraryState = window.mergeAdminLibraryState');
        expect(host).toContain('const mergeRegistrationCmsStateFromLocal = window.mergeRegistrationCmsStateFromLocal');
        expect(host).not.toContain('function mergeAdminLibraryState');
        expect(host).not.toContain('function mergeRegistrationCmsStateFromLocal');
        expect(host).not.toContain('DEFAULT_ADMIN_LIBRARY_FORM_SCHEMA_IDS');
    });

    it('index.html and admin-library.html load peel before api.js', () => {
        for (const page of ['index.html', 'admin-library.html']) {
            const html = read(page);
            expect(html.indexOf('api-admin-merge-runtime.js'), page).toBeGreaterThan(-1);
            expect(html.indexOf('api-admin-merge-runtime.js'), page)
                .toBeLessThan(html.indexOf('assets/js/app/api.js'));
        }
    });

    it('state.js AdminQuiz/AdminExam helpers live in state-admin-exam peel (E4)', () => {
        const state = read('assets/js/app/state.js');
        const peel = read('assets/js/app/state-admin-exam-runtime.js');
        const matches = state.match(/^function .*Admin(Quiz|Exam)/gm) || [];
        expect(matches.length).toBe(0);
        expect(peel).toContain('function makeAdminExamEntityId');
        expect(peel).toContain('function syncAdminQuizDraftSubject');
        expect(peel).toContain('__KIU_STATE_ADMIN_EXAM_LOADED');
    });

    it('prior danger peels remain present', () => {
        expect(existsSync(join(ROOT, 'assets/js/app/api-lms-portal-runtime.js'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/js/app/api-portal-persist-runtime.js'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/js/app/state-deleted-staff-runtime.js'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/js/app/api-admin-merge-runtime.js'))).toBe(true);
    });
});
