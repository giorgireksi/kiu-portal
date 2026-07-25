import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function listJsFiles(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...listJsFiles(fullPath));
        else if (entry.name.endsWith('.js')) files.push(fullPath);
    }
    return files;
}

describe('legacy visual purge', () => {
    it('does not ship popup button alias bridges in lux-controls.css', () => {
        const controls = readSource('assets/css/lux-controls.css');
        expect(controls).not.toMatch(/\.kiu-btn-blue\b/);
        expect(controls).not.toMatch(/\.social-neo-btn-/);
        expect(controls).toContain('.lux-primary-btn.lux-btn-danger');
        expect(controls).toContain('var(--lux-panel-cta-danger)');
    });

    it('uses lux-glass-dialog structural classes in modal SSOT', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-card');
        expect(modals).not.toMatch(/body:not\(\.lux-route-social\)/);
        expect(modals).not.toMatch(/\.social-neo-dialog-/);
    });

    it('forbids legacy popup button classes in portal popup JS', () => {
        const popupPrefixes = ['lms', 'gradebook', 'social'];
        const offenders = listJsFiles(join(process.cwd(), 'assets/js/pages'))
            .filter((file) => popupPrefixes.some((prefix) => file.includes(`/${prefix}`)))
            .map((file) => ({
                file: file.replace(`${process.cwd()}/`, ''),
                source: readFileSync(file, 'utf8')
            }))
            .filter(({ source }) => /kiu-btn-|social-neo-btn-/.test(source))
            .map(({ file }) => file);

        expect(offenders).toEqual([]);
    });

    it('forbids social-neo-dialog layout hooks in social page JS', () => {
        const offenders = listJsFiles(join(process.cwd(), 'assets/js/pages'))
            .filter((file) => file.includes('/social'))
            .map((file) => ({
                file: file.replace(`${process.cwd()}/`, ''),
                source: readFileSync(file, 'utf8')
            }))
            .filter(({ source }) => /social-neo-dialog-/.test(source))
            .map(({ file }) => file);

        expect(offenders).toEqual([]);
    });

    it('routes messenger modal chrome through warmglass tokens', () => {
        const portal = readSource('assets/css/layout-portal.css');
        expect(portal).toMatch(/\.portal-msg-modal-window[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).toMatch(/\.portal-notif-modal-window[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).toMatch(/\.portal-call-window[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).toMatch(/\.portal-msg-modal-backdrop[\s\S]*?backdrop-filter:\s*none/);
        expect(portal).toMatch(/\.portal-msg-modal-window[\s\S]*?var\(--lux-popup-slide-offset\)/);
    });

    it('routes messenger dock and panel chrome through warmglass tokens', () => {
        const portal = readSource('assets/css/layout-portal.css');
        expect(portal).toMatch(/\.portal-msg-dock[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).toMatch(/\.portal-notif-dock[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).toMatch(/\.portal-msg-panel[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(portal).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.98\)/);
    });

    it('lays out registration structured modals as fixed warmglass overlays', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(/\.registration-structured-modal-backdrop[\s\S]*?position:\s*fixed/);
        expect(modals).toMatch(/\.registration-structured-modal-backdrop[\s\S]*?z-index:\s*2600/);
        expect(modals).toMatch(/\.registration-structured-modal-backdrop\[hidden\]:not\(\.is-open\)/);
        expect(modals).toContain('.lux-glass-dialog-body');
        expect(modals).toContain('.lux-glass-dialog-actions');
        expect(modals).toMatch(/\.admin-reg-course-modal-overlay[\s\S]*?position:\s*fixed/);
        expect(modals).toMatch(/\.admin-reg-course-modal-card[\s\S]*?var\(--lux-warmglass-surface\)/);
        expect(modals).toContain('.admin-reg-course-item');
    });

    it('exports hub modal motion helpers on window', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('window.openLuxHubModalBackdrop');
        expect(utilities).toContain('window.closeLuxHubModalRoot');
    });
});
