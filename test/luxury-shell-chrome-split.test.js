import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury shell chrome split', () => {
    it('moves shell chrome owners out of index-luxury and into the dedicated shell runtime', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const homeRuntime = readSource('assets/js/features/luxury-home-dashboard-runtime.js');
        const indexHtml = readSource('index.html');

        expect(indexHtml).toContain('assets/js/features/luxury-shell-chrome.js?v=20260518-luxshell1');
        expect(luxury).toContain('window.__KIU_LUXURY_SHARED = {');
        expect(homeRuntime).toContain('window.__KIU_LUXURY_HOME_DASHBOARD_RUNTIME_READY = true;');
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
        expect(shellChrome).toContain('openHomeEditor(getEffectiveRole(), buildHomeModel(getEffectiveRole()));');
        expect(shellChrome).toContain('const mixed = mixHsl(');
        expect(luxury).toContain('openHomeEditor,');
        expect(luxury).toContain('mixHsl,');
        expect(luxury).toContain('hslToRgb,');
        expect(luxury).toContain('getThemeMode,');
        expect(luxury).toContain('toggleSidebar');
        expect(luxury).toContain("window.toggleSidebar = typeof toggleSidebar === 'function' ? toggleSidebar : window.toggleSidebar;");
        expect(luxury).toContain("if (typeof window.buildHomeWidgetDefinitions !== 'function') {");
        expect(luxury).toContain("window.buildHomeWidgetDefinitions = typeof buildHomeWidgetDefinitions === 'function' ? buildHomeWidgetDefinitions : window.buildHomeWidgetDefinitions;");
        expect(luxury).not.toContain('function renderNav() {');
        expect(luxury).not.toContain('function ensureStudio() {');
        expect(luxury).not.toContain('function populateFacultySwitcher(options = {}) {');
        expect(luxury).not.toContain('function populateRoleSwitcher(options = {}) {');
        expect(luxury).not.toContain('function syncTopbar() {');
        expect(luxury).not.toContain('function bindUserMenu() {');
        expect(luxury).not.toContain('function bindTopbarControls() {');
    });
});
