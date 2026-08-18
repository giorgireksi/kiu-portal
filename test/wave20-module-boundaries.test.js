/**
 * Wave 20 — module boundaries source locks.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

describe('Wave 20 module boundaries', () => {
    it('social-workspace exports via KiuSocialWorkspace + factory', () => {
        const src = readAsset('assets/js/pages/social-workspace.js');
        expect(src).toContain('window.KiuSocialWorkspace');
        expect(src).toContain('window.__kiuCreateSocialWorkspaceApi');
        expect(src).toContain('__kiuSwApi');
        expect(src).not.toMatch(/Object\.assign\(window,\s*window\.SocialUiKernel\)/);
        const bareAssigns = [...src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)]
            .map((m) => m[1])
            .filter((n) => !n.startsWith('__KIU_') && !n.startsWith('__kiu') && !n.startsWith('Kiu'));
        expect(bareAssigns.length).toBeLessThanOrEqual(10);
    });

    it('risk model is a lazy ESM namespace-only workspace dependency', () => {
        const model = readAsset('assets/js/pages/social-workspace-risk-model.js');
        const bridge = readAsset('assets/js/pages/social-workspace-risk-model-bridge.js');
        const html = readAsset('social.html');
        expect(model).toContain('export function installSocialWorkspaceRiskModel');
        expect(model).toContain('KiuSocialWorkspaceRiskModel');
        expect(model).not.toMatch(/Object\.keys\(api\)\.forEach/);
        expect(bridge).toContain('KiuSocialWorkspaceRiskModel');
        expect(bridge).not.toMatch(/Object\.keys\(api\)\.forEach/);
        expect(html).not.toContain('type="module" src="assets/js/pages/social-workspace-risk-model.js');
        expect(readAsset('assets/js/pages/social-page.js')).toContain('loadSocialDynamicModule(SOCIAL_WORKSPACE_RISK_MODEL_URL');
    });

    it('portal social runtime loads ESM leaf before classic bridge (no Promise.all race)', () => {
        const app = readAsset('assets/js/app/app.js');
        const loader = app.slice(
            app.indexOf('window.ensurePortalSocialRuntimeLoaded'),
            app.indexOf('window.ensurePortalNewsRuntimeLoaded')
        );
        expect(loader).toContain('loadRuntimeScriptOnce(entry)');
        expect(loader).not.toMatch(/Promise\.all\(\s*group\.map\(\s*loadRuntimeScriptOnce/);
        expect(app.indexOf("social-workspace-risk-model.js")).toBeLessThan(
            app.indexOf('social-workspace-risk-model-bridge.js')
        );
        expect(app.indexOf('social-alerts-model.js')).toBeLessThan(
            app.indexOf('social-alerts-model-bridge.js')
        );
    });

    it('form-blueprint and portal-compat are factory peels', () => {
        const bp = readAsset('assets/js/pages/form-blueprint-runtime.js');
        const compat = readAsset('assets/js/app/portal-compat-runtime.js');
        const index = readAsset('index.html');
        expect(bp).toContain('__kiuCreateFormBlueprintApi');
        expect(bp).toContain('__KIU_FORM_BLUEPRINT_RUNTIME_LOADED');
        expect(bp).toContain('window.KiuFormBlueprint');
        expect(bp).toContain('Object.assign(window, api)');
        expect(compat).toContain('__kiuCreatePortalCompatApi');
        expect(compat).toContain('__KIU_PORTAL_COMPAT_LOADED');
        expect(compat).toContain('window.KiuPortalCompat');
        expect(index).toContain('portal-compat-runtime.js');
        expect(index.indexOf('portal-compat-runtime.js')).toBeLessThan(index.indexOf('assets/js/app/app.js'));
    });

    it('social-page resolves workspace exports from Kiu namespaces', () => {
        const page = readAsset('assets/js/pages/social-page.js');
        expect(page).toContain('function resolveSocialExportImpl');
        expect(page).toContain('window.KiuSocialWorkspaceRiskModel');
        expect(page).toContain('window.KiuSocialWorkspace');
    });
});
