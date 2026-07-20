/**
 * Wave 25 — ESM ≥8 + LMS classroom tabs bag.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

describe('Wave 25 Portal A+ 10', () => {
    it('social-profile-model is an ESM leaf with classic bridge', () => {
        const html = readAsset('social.html');
        const model = readAsset('assets/js/pages/social-profile-model.js');
        const bridge = readAsset('assets/js/pages/social-profile-model-bridge.js');
        expect(model).toMatch(/export\s+function\s+installSocialProfileModel/);
        expect(model).toMatch(/export\s+const\s+\w+Api/);
        expect(bridge).toContain('ESM leaf missing');
        expect(html).toMatch(/type="module"\s+src="assets\/js\/pages\/social-profile-model\.js/);
        expect(html).toContain('social-profile-model-bridge.js');
    });

    it('LMS quiz + whiteboard models are ESM leaves with bridges in MODULE_URLS', () => {
        const tabs = readAsset('assets/js/pages/lms-classroom-tabs-runtime.js');
        for (const leaf of ['lms-quiz-model', 'lms-whiteboard-model']) {
            const model = readAsset(`assets/js/pages/${leaf}.js`);
            const bridge = readAsset(`assets/js/pages/${leaf}-bridge.js`);
            expect(model).toMatch(/export\s+function\s+install/);
            expect(model).toMatch(/export\s+const\s+\w+Api/);
            expect(bridge).toContain('ESM leaf missing');
            expect(tabs).toContain(`${leaf}.js`);
            expect(tabs).toContain(`${leaf}-bridge.js`);
        }
        expect(tabs).toMatch(/script\.type\s*=\s*['"]module['"]/);
        expect(tabs).toMatch(/lms-quiz-model\|lms-whiteboard-model/);
    });

    it('classroom tabs exposes KiuLmsClassroomTabs bag', () => {
        const src = readAsset('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(src).toContain('window.KiuLmsClassroomTabs');
        expect(src).toContain('__kiuLmsTabsApi');
        expect(src).toContain('__kiuLmsTabsExpose');
        expect(src).not.toMatch(/^window\.ensureLmsGradebookRuntime\s*=/m);
    });

    it('gates: ESM_LEAF_MIN ≥ 10', () => {
        const guard = readAsset('tools/check-architecture-guardrails.js');
        const match = guard.match(/ESM_LEAF_MIN\s*=\s*(\d+)/);
        expect(match).toBeTruthy();
        expect(Number(match[1])).toBeGreaterThanOrEqual(10);
        expect(guard).toContain('social-profile-model.js');
        expect(guard).toContain('lms-quiz-model.js');
        expect(guard).toContain('lms-whiteboard-model.js');
    });
});
