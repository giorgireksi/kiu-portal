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
    it('task + form models remain ESM leaves while task code loads with Workspace', () => {
        const html = readAsset('social.html');
        const task = readAsset('assets/js/pages/social-task-model.js');
        const taskBridge = readAsset('assets/js/pages/social-task-model-bridge.js');
        const form = readAsset('assets/js/pages/social-form-model.js');
        const formBridge = readAsset('assets/js/pages/social-form-model-bridge.js');
        const page = readAsset('assets/js/pages/social-page.js');
        for (const [model, bridge] of [[task, taskBridge], [form, formBridge]]) {
            expect(model).toMatch(/export\s+function\s+install/);
            expect(model).toMatch(/export\s+const\s+\w+Api/);
            expect(model).not.toMatch(/^\(function\s+init/m);
            expect(bridge).toContain('ESM leaf missing');
        }
        expect(html).not.toMatch(/<script[^>]+social-task-model\.js/);
        expect(html).not.toContain('social-task-model-bridge.js');
        expect(html).toMatch(/type="module"\s+src="assets\/js\/pages\/social-form-model\.js/);
        expect(html).toContain('social-form-model-bridge.js');
        expect(html.indexOf('social-form-model.js')).toBeLessThan(html.indexOf('social-form-model-bridge.js'));
        expect(html.indexOf('social-form-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));
        expect(page).toMatch(/loadSocialDynamicModule\(SOCIAL_TASK_MODEL_URL/);
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
