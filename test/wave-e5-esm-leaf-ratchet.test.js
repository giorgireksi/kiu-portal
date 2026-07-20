/**
 * CONTRACT: Wave E5 — ESM ratchet ≥8: ESM_LEAF_MIN ≥10; student-service + curriculum library leaves.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const ESM_LEAF_MIN = 10;

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave E5 ESM leaf ratchet', () => {
    it('docs + queue claim E5 / #16 ≥8', () => {
        expect(existsSync(join(ROOT, 'docs/js-esm-leaf-ratchet.md'))).toBe(true);
        expect(read('docs/js-esm-leaf-ratchet.md')).toContain('ESM_LEAF_MIN');
        const queue = read('docs/engineering-band-queue.md');
        expect(queue).toMatch(/E5\s*✅/);
        expect(queue).toMatch(/ESM/);
        expect(read('docs/engineering-a-plus-frontend-js.md')).toMatch(/E5\s*✅/);
    });

    it('student-service and curriculum library are ESM leaves with bridges', () => {
        const ssvc = read('assets/js/pages/student-service-model.js');
        expect(ssvc).toMatch(/export\s+function\s+installStudentServiceModel/);
        expect(ssvc).toMatch(/export\s+const\s+studentServiceModelApi/);
        expect(existsSync(join(ROOT, 'assets/js/pages/student-service-model-bridge.js'))).toBe(true);

        const clm = read('assets/js/shared/curriculum-library-model.js');
        expect(clm).toMatch(/export\s+function\s+installCurriculumLibraryModel/);
        expect(clm).toMatch(/export\s+const\s+curriculumLibraryModelApi/);
        expect(existsSync(join(ROOT, 'assets/js/shared/curriculum-library-model-bridge.js'))).toBe(true);

        const ssvcHtml = read('student-service.html');
        expect(ssvcHtml).toMatch(/type="module"\s+src="assets\/js\/pages\/student-service-model\.js/);
        expect(ssvcHtml).toContain('student-service-model-bridge.js');

        const programsHtml = read('programs.html');
        expect(programsHtml).toMatch(/type="module"\s+src="assets\/js\/shared\/curriculum-library-model\.js/);
        expect(programsHtml).toContain('curriculum-library-model-bridge.js');
    });

    it(`ESM_LEAF_MIN is ≥${ESM_LEAF_MIN} and markers include E5 leaves`, () => {
        const guard = read('tools/check-architecture-guardrails.js');
        const match = guard.match(/ESM_LEAF_MIN\s*=\s*(\d+)/);
        expect(match).toBeTruthy();
        expect(Number(match[1])).toBeGreaterThanOrEqual(ESM_LEAF_MIN);
        expect(guard).toContain('student-service-model.js');
        expect(guard).toContain('curriculum-library-model.js');
    });
});
