import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury home model split', () => {
    it('moves the home dashboard model helpers out of index-luxury and into the dedicated model runtime', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const homeModel = readSource('assets/js/features/luxury-home-model.js');

        expect(homeModel).toContain('function getRecentHomeUpdates(user, limit = 4) {');
        expect(homeModel).toContain('function buildHomeModel(role) {');
        expect(homeModel).toContain('function buildHomeContext(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {');
        expect(homeModel).toContain('function getRoleShortcuts(role, context) {');
        expect(homeModel).toContain('Object.assign(window, {');

        expect(luxury).not.toContain('function getRecentHomeUpdates(user, limit = 4) {');
        expect(luxury).not.toContain('function buildHomeModel(role) {');
        expect(luxury).not.toContain('function buildHomeContext(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {');
        expect(luxury).toContain('const buildHomeModel = (...args) => window.buildHomeModel(...args);');
        expect(luxury).toContain('const buildHomeContext = (...args) => window.buildHomeContext(...args);');
    });
});
