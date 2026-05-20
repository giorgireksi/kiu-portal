import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS materials module split', () => {
    it('moves LMS materials rendering and mutation helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const materialsSource = readSource('assets/js/pages/lms-materials-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-materials-runtime.js?v=20260518-lmsmaterials1');
        expect(materialsSource).toContain('function renderLmsMaterialsLibrary(resourceKey)');
        expect(materialsSource).toContain('async function createLmsMaterial(resourceKey)');
        expect(materialsSource).toContain('function deleteLmsMaterial(resourceKey, materialId)');
        expect(materialsSource).toContain('function updateLmsMaterialState(resourceKey, materialId, patch = {})');
        expect(materialsSource).toContain('function toggleLmsMaterialPinned(resourceKey, materialId)');
        expect(materialsSource).toContain('function toggleLmsMaterialArchived(resourceKey, materialId)');
        expect(materialsSource).toContain('function moveLmsMaterial(resourceKey, materialId, direction = 0)');
        expect(lmsSource).not.toContain('function renderLmsMaterialsLibrary(resourceKey)');
        expect(lmsSource).not.toContain('async function createLmsMaterial(resourceKey)');
        expect(lmsSource).not.toContain('function deleteLmsMaterial(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function updateLmsMaterialState(resourceKey, materialId, patch = {})');
        expect(lmsSource).not.toContain('function toggleLmsMaterialPinned(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function toggleLmsMaterialArchived(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function moveLmsMaterial(resourceKey, materialId, direction = 0)');
    });
});
