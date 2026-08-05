import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury shell chrome split', () => {
    it('moves shell chrome owners out of index-luxury and into the dedicated shell runtime', () => {
        const luxury = readSource('assets/js/features/index-luxury.js')
            + readSource('assets/js/features/luxury-index-runtime.js');
        const indexRuntime = readSource('assets/js/features/luxury-index-runtime.js');
        const shellChrome = [
            'assets/js/features/luxury-shell-chrome.js',
            'assets/js/features/luxury-shell-topbar-runtime.js',
            'assets/js/features/luxury-shell-picker-runtime.js',
            'assets/js/features/luxury-shell-studio-runtime.js',
        ].map(readSource).join('\n');
        const indexHtml = readSource('index.html');

        expect(indexHtml).toMatch(/assets\/js\/features\/luxury-shell-chrome\.js(\?v=[^"']+)?/);
        expect(luxury).toContain('window.__KIU_LUXURY_SHARED = {');
        // luxury-home-dashboard-runtime.js removed (unused seam stub)
        expect(() => readSource('assets/js/features/luxury-home-dashboard-runtime.js')).toThrow(/ENOENT|no such file/i);
        expect(shellChrome).toContain('function getLuxurySharedConfig() {');
        expect(shellChrome).toContain('function pageTarget(pageId) {');
        expect(shellChrome).toContain('function renderNav() {');
        expect(shellChrome).toContain('function ensureStudio() {');
        expect(shellChrome).toContain('function populateFacultySwitcher(options = {}) {');
        expect(shellChrome).toContain('function populateRoleSwitcher(options = {}) {');
        expect(shellChrome).toContain('function syncTopbar() {');
        expect(shellChrome).toContain('function bindUserMenu() {');
        expect(shellChrome).toContain('function bindTopbarControls() {');
        expect(shellChrome).toContain("typeof window.toggleSidebar === 'function'");
        expect(shellChrome).toContain('function resolveHomeModelForRole(role) {');
        // Customize dashboard removed — edit control is permanently hidden.
        expect(shellChrome).toContain("getElementById('lux-dashboard-edit-btn')");
        expect(shellChrome).toContain('editorButton.hidden = true');
        expect(shellChrome).toContain('const mixed = mixHsl(');
        expect(luxury).toContain('openHomeEditor,');
        expect(luxury).toContain('Home layout is fixed and no longer customizable');
        expect(luxury).toContain('mixHsl,');
        expect(luxury).toContain('hslToRgb,');
        expect(luxury).toContain('getThemeMode,');
        expect(luxury).not.toContain('getNotificationSnapshot,\n        getMessengerSnapshot');
        expect(luxury).not.toContain('getMessengerSnapshot,\n        buildHomeModel');
        expect(luxury).toContain('toggleSidebar');
        expect(luxury).toContain("window.toggleSidebar = typeof toggleSidebar === 'function' ? toggleSidebar : window.toggleSidebar;");
        expect(luxury).toContain("if (typeof exports?.buildHomeWidgetDefinitions === 'function') {");
        expect(indexRuntime).toContain("buildHomeWidgetDefinitions: typeof buildHomeWidgetDefinitions === 'function' ? buildHomeWidgetDefinitions : null");
        expect(indexRuntime).toContain('window.buildHomeWidgetDefinitions = exports.buildHomeWidgetDefinitions;');
        expect(luxury).not.toContain('function renderNav() {');
        expect(luxury).not.toContain('function ensureStudio() {');
        expect(luxury).not.toContain('function populateFacultySwitcher(options = {}) {');
        expect(luxury).not.toContain('function populateRoleSwitcher(options = {}) {');
        expect(luxury).not.toContain('function syncTopbar() {');
        expect(luxury).not.toContain('function bindUserMenu() {');
        expect(luxury).not.toContain('function bindTopbarControls() {');
    });
});
