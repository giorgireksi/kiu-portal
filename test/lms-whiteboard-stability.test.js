import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource, readLmsWhiteboardSessionRuntime } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard stability guards', () => {
    it('adds circuit breakers and load dedup in workspace runtime', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(workspace).toContain('LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS');
        expect(workspace).toContain('const LMS_WHITEBOARD_BACKEND_RELOAD_TTL_MS = __lmsSyncTiming.BACKEND_RELOAD_TTL_MS || 120000;');
        expect(workspace).toContain('function markLmsWhiteboardRouteUnavailable');
        expect(workspace).toContain('function markLmsWhiteboardAccessDenied');
        expect(workspace).toContain('function shouldSyncLmsWhiteboardWorkspace');
        expect(workspace).toContain('function shouldReloadLmsWhiteboardFromBackend');
        expect(workspace).toContain('function shouldIgnoreLmsWhiteboardRealtimeUpdate');
        expect(workspace).toContain('function invokeRefreshLmsWhiteboardUi');
        expect(workspace).toContain('__lmsWhiteboardLoadPromises');
        expect(workspace).toContain('routeUnavailable: false');
        expect(workspace).toContain('if (status === 404)');
        expect(workspace).toContain('markLmsWhiteboardRouteUnavailable');
    });

    it('stops session-wait poll after accessDenied or routeUnavailable', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const waitPollBlock = workspace.match(/function scheduleLmsWhiteboardSessionWaitPoll[\s\S]*?^}/m)?.[0] || '';
        expect(waitPollBlock).toContain('latest?.ui?.accessDenied || latest?.ui?.routeUnavailable');
        expect(waitPollBlock).toContain('stopLmsWhiteboardSessionWaitPoll(canonicalKey)');
    });

    it('routes async updates through refreshLmsWhiteboardUi instead of full render', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const session = readLmsWhiteboardSessionRuntime();
        const runtime = readLmsWhiteboardSource();

        const syncBlock = workspace.match(/function runImmediateLmsWhiteboardSync[\s\S]*?^}/m)?.[0] || '';
        expect(syncBlock).toContain('invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true })');
        expect(syncBlock).not.toContain('renderLmsWhiteboardSection');

        const loadBlock = workspace.match(/function loadLmsWhiteboardWorkspace[\s\S]*?^}/m)?.[0] || '';
        expect(loadBlock).toContain('repaintLmsWhiteboardAfterBackendLoad(canonicalKey)');
        expect(loadBlock).not.toContain('options.render !== false');
        expect(loadBlock).not.toContain('renderLmsWhiteboardSection');

        expect(workspace).toContain('function repaintLmsWhiteboardAfterBackendLoad');
        expect(workspace).toContain('function shouldKeepLocalLmsWhiteboardElements');
        expect(workspace).toContain('function markLmsWhiteboardClearAt');
        expect(workspace).toContain('__lmsWhiteboardClearAt');
        expect(workspace).toContain('snapshot.replaceElements = true');
        expect(workspace).toMatch(/function applyLmsWhiteboardWorkspace[\s\S]*remoteVersion < localVersion/);
        expect(workspace).toMatch(/function clearLmsWhiteboardBoard[\s\S]*bumpLmsWhiteboardLoadGeneration/);
        expect(workspace).toMatch(/function clearLmsWhiteboardBoard[\s\S]*workspace\.activity = \{\}/);
        expect(workspace).toMatch(/function buildLmsWhiteboardSyncPayload[\s\S]*snapshot\.activity = \{\}/);
        expect(workspace).toMatch(/function saveLmsWhiteboardChange[\s\S]*reason === 'clear-board'/);

        const backend = readSource('backend/platform/domains/lms-whiteboard-service.js');
        expect(backend).toMatch(/incoming\.clearBoard === true[\s\S]*next\.activity = \{\}/);

        expect(session).toContain('function refreshLmsWhiteboardUi');
        expect(session).toContain('function repaintLmsWhiteboardWorkspace');
        expect(runtime).toContain('function resetLmsWhiteboardViewport');
        expect(runtime).toContain('function syncLmsWhiteboardViewportAfterRender');
        expect(session).toContain('function finalizeLmsWhiteboardSectionRender');
        expect(runtime).toContain('__lmsWhiteboardViewportFitted');
        expect(runtime).toContain('function bindLmsWhiteboardShellActions');
        expect(runtime).toContain('function updateLmsWhiteboardVolatileUi');
        expect(runtime).toContain('function patchLmsWhiteboardRegion');
        expect(runtime).toContain('data-lms-whiteboard-region="banner"');
        expect(runtime).toContain('data-lms-whiteboard-region="sync-error"');
        const refreshBlock = session.match(/function refreshLmsWhiteboardUi[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const repaintBlock = session.match(/function repaintLmsWhiteboardWorkspace[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(refreshBlock).toContain('repaintLmsWhiteboardWorkspace(resolvedKey)');
        expect(repaintBlock).toContain('syncLmsWhiteboardDocumentLayer');
        const renderBlock = session.match(/function renderLmsWhiteboardSection[\s\S]*?deferPaintForLoad[\s\S]*?finalizeLmsWhiteboardSectionRender/)?.[0] || '';
        const finalizeBlock = session.match(/function finalizeLmsWhiteboardSectionRender[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const viewportBlock = session.match(/function syncLmsWhiteboardViewportAfterRender[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(renderBlock).toContain('deferPaintForLoad');
        expect(session).toContain('finalizeLmsWhiteboardSectionRender(canonicalKey, { fitOnce: true })');
        expect(finalizeBlock).toContain('syncLmsWhiteboardViewportAfterRender');
        expect(viewportBlock).toContain('fitLmsWhiteboardZoomToContent');
        expect(viewportBlock).toContain('resetLmsWhiteboardViewport');
    });

    it('maps missing whiteboard routes to a typed API error code', () => {
        const api = readSource('assets/js/app/api.js')
            + readSource('assets/js/app/api-lms-portal-runtime.js');

        expect(api).toContain("error.code = 'LMS_WHITEBOARD_ROUTE_MISSING'");
    });

    it('invalidates whiteboard tab cache after sync like live quiz', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js')
            + readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

        expect(workspace).toContain('window.invalidateLmsWhiteboardTabCache');
        expect(classroom).toContain('function invalidateLmsWhiteboardTabCache');
    });
});