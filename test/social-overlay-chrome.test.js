import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadOverlayChrome() {
    const runtime = {
        ui: {
            socialDialog: null,
            previousDialog: null,
            activePanel: 'feed',
            groupLeaveStep: 1,
            coverImageFile: null
        }
    };
    const renders = [];
    const sandbox = {
        window: {
            requestAnimationFrame: (cb) => { cb(); return 1; },
            scrollY: 0,
            scrollTo() {}
        },
        document: {
            body: {
                dataset: {},
                classList: { add() {}, remove() {}, contains: () => false },
                style: {},
                appendChild() {}
            },
            getElementById: () => null,
            querySelectorAll: () => [],
            createElement: (tag) => {
                const el = {
                    tagName: tag,
                    id: '',
                    className: '',
                    hidden: false,
                    children: [],
                    setAttribute() {},
                    appendChild(child) { this.children.push(child); },
                    querySelector: () => null,
                    querySelectorAll: () => []
                };
                return el;
            }
        },
        String,
        Boolean,
        Number,
        Set,
        Array,
        Promise,
        console
    };
    sandbox.window.window = sandbox.window;
    sandbox.document.body.dataset = {};
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-overlay-chrome.js'), 'utf8'),
        sandbox
    );
    const api = sandbox.window.createKiuSocialOverlayChromeApi({
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => runtime,
        root: () => null,
        PROJECT_TASK_GRAPH_STACKED_DIALOGS: new Set(['project-task-detail']),
        PROJECT_HEALTH_OVERLAY_DIALOGS: new Set(['project-task-detail']),
        workspaceDialogKeepsCenter: () => false,
        isProjectTaskGraphStackActive: () => false,
        renderDialogOnlyNow: () => { renders.push('dialog-only'); },
        renderSocialPageNow: (reason) => { renders.push(reason); },
        getSocialCenterScroller: () => null,
        scrollSocialCenterTo: () => {},
        socialScrollLockActive: () => false,
        bindOverlayPortalEvents: () => {},
        ensurePhotographyUploadFileSink: () => {},
        bindPhotographyUploadDialogFileInput: () => {},
        revokePhotographyUploadPreview: () => {},
        clearEventDraft: () => {},
        clearPostComposeDraft: () => {},
        getProjectTaskGraphHost: () => null,
        readProjectTaskGraphPanFromScroll: () => ({ x: 0, y: 0 }),
        clampProjectTaskGraphZoom: (z) => z,
        persistProjectTaskGraphView: () => {},
        clearProjectTabPaneCache: () => {},
        rebuildActiveProjectTabPaneIfPreviewHost: () => {},
        relayoutCommentTrunks: () => {}
    });
    return { api, runtime, renders, sandbox };
}

describe('social-overlay-chrome', () => {
    let api;
    let runtime;
    let renders;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, renders, sandbox } = loadOverlayChrome());
    });

    it('installs factory and peels open/close from social-page', () => {
        expect(sandbox.window.__KIU_SOCIAL_OVERLAY_CHROME_LOADED).toBe(true);
        expect(typeof api.openDialog).toBe('function');
        expect(typeof api.closeDialog).toBe('function');
        expect(typeof api.activeDialog).toBe('function');
        expect(typeof api.ensureSocialOverlayPortal).toBe('function');

        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        expect(page).not.toMatch(/function\s+openDialog\s*\(/);
        expect(page).not.toMatch(/function\s+closeDialog\s*\(/);
        expect(page).not.toMatch(/function\s+ensureSocialOverlayPortal\s*\(/);
        expect(page).toContain('createKiuSocialOverlayChromeApi');
        expect(html).toContain('social-overlay-chrome.js');
        expect(html.indexOf('social-dialog-router.js')).toBeLessThan(html.indexOf('social-overlay-chrome.js'));
        expect(html.indexOf('social-overlay-chrome.js')).toBeLessThan(html.indexOf('social-shell-nav.js'));
        expect(html.indexOf('social-overlay-chrome.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('opens and closes dialogs with render reasons', () => {
        api.openDialog('post-compose', { postId: 'p1' });
        expect(runtime.ui.socialDialog).toEqual({ type: 'post-compose', postId: 'p1' });
        expect(renders).toContain('dialog-post-compose');
        expect(api.activeDialog()?.type).toBe('post-compose');

        renders.length = 0;
        api.closeDialog();
        expect(runtime.ui.socialDialog).toBe(null);
        expect(renders).toContain('dialog-close');
    });

    it('restores stacked dialog kinds', () => {
        expect(api.shouldRestoreStackedDialog('comment-delete')).toBe(true);
        expect(api.shouldRestoreStackedDialog('post-compose')).toBe(false);
        runtime.ui.previousDialog = { type: 'project-health' };
        expect(api.shouldRestoreStackedDialog('project-task-detail')).toBe(true);
    });
});
