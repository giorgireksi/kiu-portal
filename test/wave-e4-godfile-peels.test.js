/**
 * CONTRACT: Wave E4 — God-file peels ≥8: state-admin-exam peel; state.js under 1500; ≥1800 headcount ≤6.
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

describe('Wave E4 god-file peels', () => {
    it('docs + queue claim E4 / #13–14 ≥8', () => {
        expect(existsSync(join(ROOT, 'docs/js-godfile-peels.md'))).toBe(true);
        expect(read('docs/js-godfile-peels.md')).toContain('state-admin-exam-runtime.js');

        const queue = read('docs/engineering-band-queue.md');
        expect(queue).toMatch(/E4\s*✅/);
        expect(queue).toMatch(/God-file|peels/i);
        expect(read('docs/engineering-a-plus-frontend-js.md')).toMatch(/E4\s*✅/);
    });

    it('state-admin-exam peel owns AdminQuiz/Exam helpers; host is thin', () => {
        const peel = read('assets/js/app/state-admin-exam-runtime.js');
        const host = read('assets/js/app/state.js');

        expect(peel).toContain('__KIU_STATE_ADMIN_EXAM_LOADED');
        expect(peel).toContain('__kiuCreateStateAdminExamApi');
        expect(peel).toContain('function makeAdminExamEntityId');
        expect(peel).toContain('function syncAdminQuizDraftSubject');
        expect(peel).toContain('function ensureExamSessionStore');

        expect(host).not.toMatch(/^function .*Admin(Quiz|Exam)/m);
        expect(host).not.toContain('function makeAdminExamEntityId');
        expect(host.split('\n').length).toBeLessThanOrEqual(1600);
    });

    it('index.html and exams.html load peel before state.js', () => {
        for (const page of ['index.html', 'exams.html', 'lms.html']) {
            const html = read(page);
            expect(html.indexOf('state-admin-exam-runtime.js'), page).toBeGreaterThan(-1);
            expect(html.indexOf('state-admin-exam-runtime.js'), page)
                .toBeLessThan(html.indexOf('assets/js/app/state.js'));
        }
    });

    it(`assets/js ≥${HOT_MIN} headcount ≤${HOT_MAX_COUNT}`, () => {
        const hot = listAssetsJs()
            .map((abs) => readFileSync(abs, 'utf8').split(/\r?\n/).length)
            .filter((n) => n >= HOT_MIN);
        expect(hot.length).toBeLessThanOrEqual(HOT_MAX_COUNT);
    });

    it('architecture ceiling for state.js is ≤1500', () => {
        const guard = read('tools/check-architecture-guardrails.js');
        const block = guard.match(/file:\s*'assets\/js\/app\/state\.js'[\s\S]*?maxLines:\s*(\d+)/);
        expect(block).toBeTruthy();
        expect(Number(block[1])).toBeLessThanOrEqual(1600);
        expect(guard).toContain('state-admin-exam-runtime.js');
    });
});
