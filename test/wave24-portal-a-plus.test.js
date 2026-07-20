/**
 * Wave 24 — Portal A+ 10 (ESM + globals + test hygiene markers).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

describe('Wave 24 Portal A+ 10', () => {
    it('alerts + panel models are ESM leaves with classic bridges', () => {
        const html = readAsset('social.html');
        for (const leaf of ['social-alerts-model', 'social-panel-model']) {
            const model = readAsset(`assets/js/pages/${leaf}.js`);
            const bridge = readAsset(`assets/js/pages/${leaf}-bridge.js`);
            expect(model).toMatch(/export\s+function\s+install/);
            expect(model).toMatch(/export\s+const\s+\w+Api/);
            expect(bridge).toContain('ESM leaf missing');
            expect(html).toMatch(new RegExp(`type="module"\\s+src="assets/js/pages/${leaf}\\.js`));
            expect(html).toContain(`${leaf}-bridge.js`);
        }
    });

    it('gradebook workspace exposes KiuGradebookWorkspace bag', () => {
        const src = readAsset('assets/js/pages/gradebook-workspace.js');
        expect(src).toContain('window.KiuGradebookWorkspace');
        expect(src).toContain('__kiuGbApi');
        expect(src).toContain('__kiuGbExpose');
        expect(src).not.toMatch(/^window\.openStudentEvaluationHistoryModal\s*=/m);
    });

    it('gates: Wave 24 raised ESM floor and cut bare (superseded by Waves 25–26)', () => {
        const guard = readAsset('tools/check-architecture-guardrails.js');
        expect(guard).toMatch(/ESM_LEAF_MIN\s*=\s*\d+/);
        expect(guard).toMatch(/BARE_WINDOW_ASSIGN_MAX\s*=\s*\d+/);
        expect(guard).toContain('social-alerts-model.js');
        expect(guard).toContain('social-panel-model.js');
    });
});
