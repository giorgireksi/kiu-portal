/**
 * Wave 23 — ESM leaf expansion (modern stack path A).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

describe('Wave 23 ESM leaf expansion', () => {
    it('task + form models are ESM leaves with classic bridges on social.html', () => {
        const html = readAsset('social.html');
        for (const leaf of ['social-task-model', 'social-form-model']) {
            const model = readAsset(`assets/js/pages/${leaf}.js`);
            const bridge = readAsset(`assets/js/pages/${leaf}-bridge.js`);
            expect(model).toMatch(/export\s+function\s+install/);
            expect(model).toMatch(/export\s+const\s+\w+Api/);
            expect(model).not.toMatch(/^\(function\s+init/m);
            expect(bridge).toContain('ESM leaf missing');
            expect(html).toMatch(new RegExp(`type="module"\\s+src="assets/js/pages/${leaf}\\.js`));
            expect(html).toContain(`${leaf}-bridge.js`);
            expect(html.indexOf(`${leaf}.js`)).toBeLessThan(html.indexOf(`${leaf}-bridge.js`));
        }
        expect(html.indexOf('social-task-model-bridge.js')).toBeLessThan(html.indexOf('social-form-model.js'));
        expect(html.indexOf('social-form-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('guardrails enforce ≥10 ESM leaves', () => {
        const guard = readAsset('tools/check-architecture-guardrails.js');
        expect(guard).toMatch(/ESM_LEAF_MIN\s*=\s*\d+/);
        expect(Number(guard.match(/ESM_LEAF_MIN\s*=\s*(\d+)/)[1])).toBeGreaterThanOrEqual(10);
        expect(guard).toContain('social-task-model.js');
        expect(guard).toContain('social-form-model.js');
        expect(guard).toContain('social-alerts-model.js');
        expect(guard).toContain('social-panel-model.js');
        expect(guard).toContain('student-service-model.js');
        expect(guard).toContain('curriculum-library-model.js');
        expect(guard).toContain('PASS ESM leaf gate');
    });
});
