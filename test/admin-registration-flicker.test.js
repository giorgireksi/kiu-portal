import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match?.[0] || '';
}

describe('admin registration flicker prevention', () => {
    it('toggleAdminRegModule re-renders track panes without full module rebuild', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const toggleFn = extractFunctionBody(adminRegistration, 'toggleAdminRegModule\\(moduleId\\)');

        expect(toggleFn).toContain('resolveAdminRegTab(adminRegActiveTab)');
        expect(toggleFn).toContain('renderAdminRegTrackProgramPane(adminRegActiveTab, tabConfig)');
        expect(toggleFn).toMatch(/renderAdminRegTrackProgramPane\(adminRegActiveTab, tabConfig\);\s*return;/);
        expect(toggleFn).toContain('renderAdminRegistrationModules(adminRegActiveTab)');
    });

    it('handleAdminRegistrationCmsChanged skips force when revision and faculty are unchanged', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const handlerFn = extractFunctionBody(adminRegistration, 'handleAdminRegistrationCmsChanged\\(\\)');

        expect(handlerFn).toContain('container.dataset.cmsRevision === cmsRevision');
        expect(handlerFn).toContain('container.dataset.cmsFaculty === faculty');
        expect(handlerFn).toMatch(
            /hasVisibleAdminRegistrationCmsContent\(container\)[\s\S]*?return;[\s\S]*?bootAdminRegistrationCms\(adminRegActiveTab \|\| 'prog'\)/
        );
        expect(handlerFn).not.toContain("{ force: true }");
    });

    it('queueKiuUiRefresh does not call renderAdminRegistrationModules', () => {
        const state = readSource('assets/js/app/state.js');
        const queueFn = extractFunctionBody(state, 'queueKiuUiRefresh\\(snapshot\\)');

        expect(queueFn).toContain('typeof renderAdminRegistrationModules === \'function\'');
        expect(queueFn).not.toMatch(/renderAdminRegistrationModules\s*\(/);
        expect(queueFn).toContain('causing flicker');
    });

    it('prog tab preserves program list scroll position', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');

        expect(track).toContain("scrollKey: 'admin-reg-prog-programs'");
        expect(track).toContain('data-preserve-scroll-key="${escapeHtml(tabConfig.scrollKey)}"');
        expect(track).toContain('class="admin-reg-program-list"');
    });

    it('registration container opts out of luxury transparency rewriting', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');

        expect(track).toContain("container.setAttribute('data-lux-transparency-exempt', '1')");
        expect(adminRegistration).toContain("container.setAttribute('data-lux-transparency-exempt', '1')");
    });

    it('admin registration gear manage modal markup exists', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const shared = readSource('assets/js/pages/registration-shared.js');
        const css = readSource('assets/css/admin-tools-luxury.css');

        expect(track).toContain('function buildAdminRegManageGearMarkup');
        expect(track).toContain('data-admin-reg-manage-program=');
        expect(track).toContain('function openAdminRegProgramManage');
        expect(track).not.toContain('admin-reg-overflow-menu');
        expect(shared).toContain('function openAdminRegManageModal');
        expect(css).toContain('.admin-reg-manage-gear-btn');
        expect(css).toContain('#kiu-admin-reg-manage-modal .admin-reg-manage-modal-action--danger');
    });
});