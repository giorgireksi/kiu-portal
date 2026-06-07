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
        const routeCss = readSource('assets/css/lms-route.css');

        expect(lmsHtml).toContain('assets/js/pages/lms-materials-runtime.js?v=20260518-lmsmaterials1');
        expect(materialsSource).toContain('function renderLmsMaterialsLibrary(resourceKey)');
        expect(materialsSource).toContain('async function createLmsMaterial(resourceKey)');
        expect(materialsSource).toContain('function deleteLmsMaterial(resourceKey, materialId)');
        expect(materialsSource).toContain('function updateLmsMaterialState(resourceKey, materialId, patch = {})');
        expect(materialsSource).toContain('function toggleLmsMaterialPinned(resourceKey, materialId)');
        expect(materialsSource).toContain('function toggleLmsMaterialArchived(resourceKey, materialId)');
        expect(materialsSource).toContain('function moveLmsMaterial(resourceKey, materialId, direction = 0)');
        expect(materialsSource).toContain('class="lms-route-panel lms-route-panel-pad-16-20"');
        expect(materialsSource).toContain('class="lms-route-inline lms-route-inline-center lms-route-inline-gap-12"');
        expect(materialsSource).toContain('class="fas fa-folder-open lms-route-lead-icon"');
        expect(materialsSource).toContain('class="lms-route-panel lms-route-panel-compact"');
        expect(materialsSource).toContain('class="lms-route-copy lms-route-copy-mt-4"');
        expect(materialsSource).toContain('class="kiu-btn-outline lms-route-btn-compact"');
        expect(materialsSource).toContain('class="lms-route-card-head lms-route-card-head-mb-16"');
        expect(materialsSource).toContain('class="lms-route-copy lms-route-copy-mt-6"');
        expect(materialsSource).toContain('class="lms-route-actions lms-route-actions-mt-16"');
        expect(materialsSource).toContain('class="kiu-btn-outline lms-route-btn-compact lms-route-btn-compact-square"');
        expect(materialsSource).toContain('class="kiu-btn-outline lms-route-btn-compact lms-route-btn-compact-square lms-route-btn-danger"');
        expect(materialsSource).toContain('class="lms-route-card-grid lms-material-card-grid"');
        expect(materialsSource).toContain('class="lms-route-card lms-route-panel-compact lms-material-card"');
        expect(materialsSource).toContain('class="lms-route-card-head lms-material-card-head"');
        expect(materialsSource).toContain('class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-12 lms-material-card-meta"');
        expect(materialsSource).toContain("shellClass: 'lms-route-file-shell lms-material-card-attachment'");
        expect(materialsSource).toContain('class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-12 lms-material-card-meta"');
        expect(materialsSource).toContain('renderLmsStoredFileAttachmentShell(item.file');
        expect(materialsSource).toContain('class="lms-route-stack lms-route-copy-mt-12 lms-route-stack-gap-10"');
        expect(materialsSource).toContain('class="lms-route-card lms-route-panel-compact lms-route-inline lms-route-inline-between lms-route-inline-gap-12 lms-route-inline-center lms-material-archive-item"');
        expect(materialsSource).toContain('class="lms-route-card-title lms-route-card-title-14"');
        expect(materialsSource).toContain('class="lms-route-meta lms-route-meta-11 lms-route-copy-mt-4"');
        expect(materialsSource).not.toContain('style="padding:16px 20px;"');
        expect(materialsSource).not.toContain('style="display:flex;align-items:center;gap:12px;"');
        expect(materialsSource).not.toContain('style="font-size:18px;color:var(--lux-accent-2);"');
        expect(materialsSource).not.toContain('style="margin-top:4px;"');
        expect(materialsSource).not.toContain('style="margin-top:6px;"');
        expect(materialsSource).not.toContain('style="margin-top:12px;"');
        expect(materialsSource).not.toContain('style="margin-top:14px;"');
        expect(materialsSource).not.toContain('style="margin-top:16px;"');
        expect(materialsSource).not.toContain('style="padding:8px 14px;font-size:12px;"');
        expect(materialsSource).not.toContain('style="padding:7px 10px;"');
        expect(materialsSource).not.toContain('style="padding:7px 10px; color:var(--lux-red); border-color:rgba(220,38,38,0.18);"');
        expect(materialsSource).not.toContain('style="display:flex; justify-content:space-between; gap:12px; align-items:center;"');
        expect(materialsSource).not.toContain('style="font-size:15px; margin-top:6px;"');
        expect(routeCss).toContain('.lms-route-actions-mt-14');
        expect(routeCss).toContain('.lms-route-card-title-15');
        expect(routeCss).toContain('.lms-route-btn-compact-square');
        expect(routeCss).toContain('.lms-route-btn-danger');
        expect(routeCss).toContain('.lms-route-panel-pad-16-20');
        expect(routeCss).toContain('.lms-route-lead-icon');
        expect(routeCss).toContain('.lms-material-card {');
        expect(routeCss).toContain('.lms-material-card-grid {');
        expect(routeCss).toContain('.lms-material-card-attachment {');
        expect(routeCss).toContain('.lms-material-archive-item {');
        expect(lmsSource).not.toContain('function renderLmsMaterialsLibrary(resourceKey)');
        expect(lmsSource).not.toContain('async function createLmsMaterial(resourceKey)');
        expect(lmsSource).not.toContain('function deleteLmsMaterial(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function updateLmsMaterialState(resourceKey, materialId, patch = {})');
        expect(lmsSource).not.toContain('function toggleLmsMaterialPinned(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function toggleLmsMaterialArchived(resourceKey, materialId)');
        expect(lmsSource).not.toContain('function moveLmsMaterial(resourceKey, materialId, direction = 0)');
    });
});
