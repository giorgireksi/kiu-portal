import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadOverlayChrome(extraDeps = {}) {
    const runtime = {
        ui: {
            socialDialog: null,
            previousDialog: null,
            activePanel: 'feed',
            groupLeaveStep: 1,
            coverImageFile: null,
            projectTaskGraphStackAnchor: null
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
    sandbox.requestAnimationFrame = sandbox.window.requestAnimationFrame;
    sandbox.document.body.dataset = {};
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-overlay-chrome.js'), 'utf8'),
        sandbox
    );
    const api = sandbox.window.createKiuSocialOverlayChromeApi({
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => runtime,
        root: () => null,
        PROJECT_TASK_GRAPH_STACKED_DIALOGS: new Set([
            'project-task-detail',
            'project-health',
            'project-risk',
            'project-task-graph-history'
        ]),
        PROJECT_HEALTH_OVERLAY_DIALOGS: new Set(['project-task-detail', 'project-risk', 'project-health-plan-pick']),
        getProjectTaskGraphStackAnchorDialog: () => (
            runtime.ui.projectTaskGraphStackAnchor?.type === 'project-task-graph'
                ? runtime.ui.projectTaskGraphStackAnchor
                : (runtime.ui.previousDialog?.type === 'project-task-graph' ? runtime.ui.previousDialog : null)
        ),
        workspaceDialogKeepsCenter: () => false,
        overlayDialogPreservesScroll: () => false,
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
        relayoutCommentTrunks: () => {},
        ...extraDeps
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

    it('includes call overlay in socialInteractionContains', () => {
        const overlay = readFileSync(join(process.cwd(), 'assets/js/pages/social-overlay-chrome.js'), 'utf8');
        expect(overlay).toContain("const SOCIAL_CALL_OVERLAY_ID = 'social-neo-call-overlay'");
        expect(overlay).toMatch(/callOverlay && callOverlay\.contains\(node\)/);
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

    it('uses dialog-only render for post-comments open and close', () => {
        const preservedTypes = new Set(['post-comments', 'photography-comments', 'comment-delete', 'comment-report']);
        const preserved = loadOverlayChrome({
            overlayDialogPreservesScroll: (type) => preservedTypes.has(String(type || '').trim())
        });
        const { api: preservedApi, runtime: preservedRuntime, renders: preservedRenders } = preserved;

        preservedRenders.length = 0;
        preservedApi.openDialog('post-comments', { postId: 'p1' });
        expect(preservedRuntime.ui.socialDialog).toEqual({ type: 'post-comments', postId: 'p1' });
        expect(preservedRenders).toEqual(['dialog-only']);

        preservedRenders.length = 0;
        preservedApi.closeDialog();
        expect(preservedRuntime.ui.socialDialog).toBe(null);
        expect(preservedRenders).toEqual(['dialog-only']);
        expect(preservedRenders).not.toContain('dialog-close');
        expect(preservedRuntime.ui.closingDialogType).toBe('');
    });

    it('restores post-comments with dialog-only render when leaving comment-delete', () => {
        const preservedTypes = new Set(['post-comments', 'photography-comments', 'comment-delete', 'comment-report']);
        const preserved = loadOverlayChrome({
            overlayDialogPreservesScroll: (type) => preservedTypes.has(String(type || '').trim())
        });
        const { api: preservedApi, runtime: preservedRuntime, renders: preservedRenders } = preserved;
        preservedRuntime.ui.socialDialog = { type: 'comment-delete', postId: 'p1', commentId: 'c1' };
        preservedRuntime.ui.previousDialog = { type: 'post-comments', postId: 'p1' };
        preservedRenders.length = 0;
        preservedApi.restorePreviousDialog();
        expect(preservedRuntime.ui.socialDialog).toEqual({ type: 'post-comments', postId: 'p1' });
        expect(preservedRenders).toEqual(['dialog-only']);
    });

    it('stacks project-health above an open task graph', () => {
        runtime.ui.socialDialog = { type: 'project-task-graph', projectId: 'p1' };
        api.openDialog('project-health', { projectId: 'p1' });
        expect(runtime.ui.socialDialog).toEqual({ type: 'project-health', projectId: 'p1' });
        expect(runtime.ui.previousDialog).toEqual({ type: 'project-task-graph', projectId: 'p1' });
        expect(runtime.ui.projectTaskGraphStackAnchor).toEqual({ type: 'project-task-graph', projectId: 'p1' });
    });

    it('replaces health with risk on graph instead of stacking siblings', () => {
        runtime.ui.socialDialog = { type: 'project-health', projectId: 'p1' };
        runtime.ui.previousDialog = { type: 'project-task-graph', projectId: 'p1' };
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        api.openDialog('project-risk', { projectId: 'p1' });
        expect(runtime.ui.socialDialog).toEqual({ type: 'project-risk', projectId: 'p1' });
        expect(runtime.ui.previousDialog).toEqual({ type: 'project-task-graph', projectId: 'p1' });
        expect(runtime.ui.previousDialog.__restorePrevious).toBeUndefined();
        expect(runtime.ui.projectTaskGraphStackAnchor).toEqual({ type: 'project-task-graph', projectId: 'p1' });
    });

    it('closing replaced graph child restores graph not prior sibling', () => {
        runtime.ui.socialDialog = { type: 'project-risk', projectId: 'p1' };
        runtime.ui.previousDialog = { type: 'project-task-graph', projectId: 'p1' };
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        renders.length = 0;
        api.closeDialog();
        expect(runtime.ui.socialDialog).toEqual({ type: 'project-task-graph', projectId: 'p1' });
        expect(runtime.ui.previousDialog).toBe(null);
    });

    it('still stacks health plan picker above health on graph', () => {
        runtime.ui.socialDialog = { type: 'project-health', projectId: 'p1' };
        runtime.ui.previousDialog = { type: 'project-task-graph', projectId: 'p1' };
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        api.openDialog('project-health-plan-pick', { projectId: 'p1', horizon: 'weeks' });
        expect(runtime.ui.socialDialog).toEqual({ type: 'project-health-plan-pick', projectId: 'p1', horizon: 'weeks' });
        expect(runtime.ui.previousDialog.type).toBe('project-health');
        expect(runtime.ui.previousDialog.__restorePrevious).toEqual({ type: 'project-task-graph', projectId: 'p1' });
    });

    it('social-page defines graph stacked dialog kinds before overlay chrome init', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const overlayIdx = page.indexOf('createKiuSocialOverlayChromeApi');
        const stackedIdx = page.indexOf("const PROJECT_TASK_GRAPH_STACKED_DIALOGS = new Set([");
        expect(stackedIdx).toBeGreaterThan(-1);
        expect(stackedIdx).toBeLessThan(overlayIdx);
        expect(page).toContain("'project-health'");
        expect(page).not.toContain('PROJECT_TASK_GRAPH_STACKED_DIALOGS: window.PROJECT_TASK_GRAPH_STACKED_DIALOGS');
    });
    it('restores stacked dialog kinds', () => {
        expect(api.shouldRestoreStackedDialog('comment-delete')).toBe(true);
        expect(api.shouldRestoreStackedDialog('post-compose')).toBe(false);
        runtime.ui.previousDialog = { type: 'project-health' };
        expect(api.shouldRestoreStackedDialog('project-task-detail')).toBe(true);
        runtime.ui.previousDialog = { type: 'project-task-graph' };
        expect(api.shouldRestoreStackedDialog('project-health')).toBe(true);
    });

    it('clears graph stack anchor when closing orphaned history', () => {
        runtime.ui.socialDialog = { type: 'project-task-graph-history', projectId: 'p1' };
        runtime.ui.previousDialog = null;
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        renders.length = 0;
        api.closeDialog();
        expect(runtime.ui.socialDialog).toBe(null);
        expect(runtime.ui.projectTaskGraphStackAnchor).toBe(null);
        expect(renders).toContain('dialog-close');
    });

    it('clears graph stack anchor when fully closing overlay above graph', () => {
        runtime.ui.socialDialog = { type: 'project-settings', projectId: 'p1' };
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        renders.length = 0;
        api.closeDialog();
        expect(runtime.ui.projectTaskGraphStackAnchor).toBe(null);
        expect(renders).toContain('dialog-close');
    });

    it('recovers from stale anchor when socialDialog is already null', () => {
        runtime.ui.socialDialog = null;
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        renders.length = 0;
        api.closeDialog();
        expect(runtime.ui.projectTaskGraphStackAnchor).toBe(null);
        expect(renders).toContain('dialog-only');
    });

    it('keeps pending dialog state while lazy module paint is still empty', () => {
        const portal = {
            id: 'social-neo-overlay-portal',
            contains(node) { return node === dialogRegion; },
            hidden: false,
            children: [],
            setAttribute() {},
            appendChild(child) { this.children.push(child); }
        };
        const dialogRegion = {
            id: 'lux-glass-dialog-region',
            innerHTML: '',
            querySelector: () => null
        };
        portal.children.push(dialogRegion);
        sandbox.document.getElementById = (id) => {
            if (id === 'social-neo-overlay-portal') return portal;
            if (id === 'lux-glass-dialog-region') return dialogRegion;
            return null;
        };

        runtime.ui.socialDialog = { type: 'group-create' };
        api.pruneStaleSocialOverlayState();
        expect(runtime.ui.socialDialog).toEqual({ type: 'group-create' });
    });

    it('uses desktop center-scroller overlay lock without body position fixed', () => {
        const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-overlay-chrome.js'), 'utf8');
        expect(source).toContain('function pinCenterScrollerForOverlay()');
        expect(source).toContain('function restoreCenterScrollerOverlayPin()');
        expect(source).toMatch(/if \(socialScrollLockActive\(\)\) \{[\s\S]*pinCenterScrollerForOverlay\(\)/);
        expect(source).toMatch(/if \(socialScrollLockActive\(\)\) \{[\s\S]*pinCenterScrollerForOverlay\(\)[\s\S]*\} else \{[\s\S]*document\.body\.style\.position = 'fixed'/);
    });

    it('restores saved scroll before clearing overlay lock artifacts', () => {
        const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-overlay-chrome.js'), 'utf8');
        const unlock = source.match(/if \(!stateOpen\) \{[\s\S]*?\n            \}/);
        expect(unlock?.[0] || '').toContain('socialOverlayScrollY');
        expect(unlock?.[0] || '').toContain('socialOverlayCenterScrollY');
        expect(unlock?.[0] || '').toMatch(/const scrollY[\s\S]*const centerScrollY[\s\S]*clearSocialOverlayLockArtifacts\(\)/);
        expect(unlock?.[0] || '').toMatch(/centerScroller\.scrollTop = centerScrollY[\s\S]*clearSocialOverlayLockArtifacts\(\)/);
        expect(unlock?.[0] || '').not.toMatch(/clearSocialOverlayLockArtifacts\(\)[\s\S]*scrollSocialCenterTo\(centerScrollY/);
        expect(readFileSync(join(process.cwd(), 'social.html'), 'utf8'))
            .toContain('social-overlay-chrome.js?v=20260802-dialogscroll3');
    });

    it('does not call scrollSocialCenterTo on desktop overlay unlock', () => {
        const centerScroller = {
            scrollTop: 420,
            style: {
                overflow: '',
                removeProperty(key) { delete this[key]; }
            },
            dataset: {}
        };
        let scrollSocialCenterToCalls = 0;
        const { api, runtime, sandbox } = loadOverlayChrome({
            root: () => ({ querySelector: () => centerScroller }),
            getSocialCenterScroller: () => centerScroller,
            socialScrollLockActive: () => true,
            scrollSocialCenterTo: () => { scrollSocialCenterToCalls += 1; },
            overlayDialogPreservesScroll: (type) => type === 'post-comments'
        });
        const body = sandbox.document.body;
        api.openDialog('post-comments', { postId: 'p1' });
        expect(body.dataset.socialOverlayCenterScrollY).toBe('420');
        expect(centerScroller.style.overflow).toBe('hidden');
        scrollSocialCenterToCalls = 0;
        api.closeDialog();
        expect(scrollSocialCenterToCalls).toBe(0);
        expect(centerScroller.scrollTop).toBe(420);
        expect(body.dataset.socialOverlayLocked).toBeUndefined();
        expect(runtime.ui.socialDialog).toBe(null);
    });
});
