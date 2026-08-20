import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function makeStore() {
    const store = new PlatformStore({});
    store.state.accounts['owner-1'] = {
        id: 'owner-1', displayName: 'Owner One', email: 'owner@example.com', role: 'student', facultyCode: 'ECON'
    };
    store.state.accounts['viewer-1'] = {
        id: 'viewer-1', displayName: 'Viewer One', email: 'viewer@example.com', role: 'student', facultyCode: 'ECON'
    };
    store.state.files = {
        proof_image: {
            id: 'proof_image', ownerUserId: 'owner-1', uploadedBy: 'owner-1',
            name: 'proof.png', type: 'image/png', size: 128, uploadedAt: '2026-08-21T00:00:00.000Z'
        },
        private_image: {
            id: 'private_image', ownerUserId: 'viewer-1', uploadedBy: 'viewer-1',
            name: 'private.png', type: 'image/png', size: 128, uploadedAt: '2026-08-21T00:00:00.000Z'
        },
        not_image: {
            id: 'not_image', ownerUserId: 'owner-1', uploadedBy: 'owner-1',
            name: 'notes.pdf', type: 'application/pdf', size: 128, uploadedAt: '2026-08-21T00:00:00.000Z'
        }
    };
    return store;
}

describe('social project task proof images', () => {
    it('normalizes owned image references and notes on task updates', () => {
        const store = makeStore();
        const project = store.createSocialProject({ title: 'Proof project', status: 'published', visibility: 'public', visibilityMode: 'all_logged_in' }, 'owner-1');
        const task = store.createSocialProjectTask(project.id, { title: 'Build screen' }, 'owner-1');
        const updated = store.updateSocialProjectTask(project.id, task.id, {
            proofItems: [
                { id: 'proof_image', storageKey: 'proof_image', note: 'Implemented the responsive view.' },
                { id: 'private_image', storageKey: 'private_image', note: 'Should not attach.' },
                { id: 'not_image', storageKey: 'not_image', note: 'Wrong type.' }
            ]
        }, 'owner-1');

        expect(updated.proofItems).toHaveLength(1);
        expect(updated.proofItems[0]).toMatchObject({
            id: 'proof_image', storageKey: 'proof_image', type: 'image/png', note: 'Implemented the responsive view.'
        });
    });

    it('accepts image data URLs when a WebView omits the File MIME type', async () => {
        const uploadsDir = mkdtempSync(join(tmpdir(), 'kiu-proof-test-'));
        try {
            const store = new PlatformStore({ uploadsDir });
            const file = await store.createFileFromUpload({
                name: 'proof.png',
                type: 'application/octet-stream',
                uploadedBy: 'owner-1',
                dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
            });
            expect(file).toMatchObject({ name: 'proof.png', type: 'image/png' });
        } finally {
            rmSync(uploadsDir, { recursive: true, force: true });
        }
    });

    it('caps proof items and note length while preserving project file access', () => {
        const store = makeStore();
        const project = store.createSocialProject({ title: 'Proof project', status: 'published', visibility: 'public', visibilityMode: 'all_logged_in' }, 'owner-1');
        const task = store.createSocialProjectTask(project.id, { title: 'Build screen' }, 'owner-1');
        const longNote = 'x'.repeat(1400);
        const proofItems = Array.from({ length: 20 }, (_, index) => ({
            id: 'proof_image', storageKey: 'proof_image', note: longNote, sortOrder: index
        }));
        const updated = store.updateSocialProjectTask(project.id, task.id, { proofItems }, 'owner-1');

        expect(updated.proofItems).toHaveLength(12);
        expect(updated.proofItems[0].note).toHaveLength(1000);
        expect(store.canActorAccessStoredFile('proof_image', 'viewer-1', 'student')).toBe(true);
    });
});

it('renders proof controls through the task detail surface', async () => {
    const { readFileSync } = await import('fs');
    const source = readFileSync('assets/js/pages/social-workspace-dialogs.js', 'utf8');
    const graphSource = readFileSync('assets/js/pages/social-workspace-graph-render.js', 'utf8');
    expect(source).toContain('Proof &amp; evidence');
    expect(source).toContain('renderProjectTaskProofModal');
    expect(graphSource).toContain('renderProjectTaskGraphProofSection');
    expect(graphSource).toContain('data-action="project-task-proof-open"');
    expect(source).toContain('name="projectTaskProofFiles"');
    expect(source).toContain('data-action="project-task-proof-save-note"');
    expect(source).toContain('data-action="project-task-proof-remove"');
    expect(source).toContain('data-project-id="${escape(projectId)}" data-task-id="${escape(taskId)}"');
    const dialogRouteSource = readFileSync('assets/js/pages/social-workspace-dialog-route.js', 'utf8');
    const shellNavSource = readFileSync('assets/js/pages/social-shell-nav.js', 'utf8');
    const workspaceEventsSource = readFileSync('assets/js/pages/social-workspace-events.js', 'utf8');
    expect(dialogRouteSource).toContain('data-action="project-task-proof-preview-close"');
    expect(workspaceEventsSource).toContain("openDialog('project-task-proof', { projectId, taskId });");
    expect(shellNavSource).toContain("action === 'project-task-proof-preview-close'");
    expect(shellNavSource).toContain('restorePreviousDialog();');
    expect(source).toContain('data-proof-drop');
    expect(source).toContain('data-proof-status');
    expect(source).toContain('spt-proof-modal-backdrop');
    const bareCss = readFileSync('assets/css/lux-page-bare-lite.css', 'utf8');
    expect(bareCss).toContain('.spt-proof-modal-backdrop > .lux-glass-dialog-card--project-task-proof');
    expect(bareCss).toContain('position: fixed !important;');
    expect(bareCss).toContain('z-index: 2147483000 !important;');
    const eventsSource = readFileSync('assets/js/pages/social-page-events.js', 'utf8');
    const bootSource = readFileSync('assets/js/pages/social-page-boot-runtime.js', 'utf8');
    expect(eventsSource).toContain('bindTaskProofUploadEvents');
    expect(eventsSource).toContain('window.addPortalSocialProjectTaskProof');
    expect(readFileSync('assets/js/pages/social-page.js', 'utf8')).toContain('resolvingProjectTaskGraphStackAnchor');
    expect(bootSource).toContain('bindTaskProofUploadEvents(host, signal)');
    const socialHtml = readFileSync('social.html', 'utf8');
    expect(socialHtml).toMatch(/social-page-events\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/social-workspace-stubs\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/social-dialog-router\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/social-overlay-chrome\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/social-shell-nav\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/api-lms-portal-runtime\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/api\.js\?v=20260822-/);
    expect(socialHtml).toMatch(/social-standalone-bootstrap\.js\?v=20260822-/);
    const serviceWorker = readFileSync('service-worker.js', 'utf8');
    expect(serviceWorker).toMatch(/\/assets\/js\/pages\/social-page-events\.js\?v=20260822-/);
    expect(serviceWorker).toMatch(/\/assets\/js\/app\/api-lms-portal-runtime\.js\?v=20260822-/);
    expect(serviceWorker).toMatch(/\/assets\/js\/app\/api\.js\?v=20260822-/);
    expect(serviceWorker).toMatch(/\/assets\/js\/app\/social-standalone-bootstrap\.js\?v=20260822-/);
});
