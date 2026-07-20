/* CONTRACT: New JS uses only patterns A/B/C — no fourth global dialect. — see docs/test-as-map.md */
/**
 * Wave H4 — Naming honesty + Cognitive load (≥8/10): exactly three patterns.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

describe('Wave H4 naming patterns', () => {
    it('patterns doc locks A/B/C and forbids a fourth dialect', () => {
        const doc = read('docs/js-naming-patterns.md');
        expect(doc).toMatch(/exactly three/i);
        expect(doc).toMatch(/Pattern A/i);
        expect(doc).toMatch(/Pattern B/i);
        expect(doc).toMatch(/Pattern C/i);
        expect(doc).toMatch(/ESM leaf \+ bridge/i);
        expect(doc).toMatch(/Kiu bag \+ Expose/i);
        expect(doc).toMatch(/Factory peel/i);
        expect(doc).toMatch(/Forbidden \(fourth dialect\)/i);
        expect(doc).toContain('window.Name = Name');
    });

    it('state.js migrated to Pattern B KiuState bag', () => {
        const src = read('assets/js/app/state.js');
        expect(src).toContain('window.KiuState');
        expect(src).toContain('__kiuStateApi');
        expect(src).toContain('__kiuStateExpose');
        const sameNameBare = [...src.matchAll(/^window\.([A-Za-z_$][\w$]*)\s*=\s*\1\s*;/gm)]
            .map((m) => m[1])
            .filter((name) => !name.startsWith('__KIU_') && !name.startsWith('__kiu') && !name.startsWith('Kiu'));
        expect(sameNameBare).toEqual([]);
    });

    it('rubric claims Naming + Cognitive load 8/10 and H4 done', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Naming honesty[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/Cognitive load[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H4\s*✅/);
        expect(rubric).toContain('js-naming-patterns.md');
        expect(rubric).toMatch(/Human A\+[\s\S]*?claimed/i);
        expect(rubric).not.toMatch(/6\.5 honest|~6\.5 honest/);
    });
});
