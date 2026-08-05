import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    if (relativePath === 'assets/js/pages/lms-live-quiz-ui-runtime.js') {
        return readFileSync(join(process.cwd(), relativePath), 'utf8')
            + readFileSync(join(process.cwd(), 'assets/js/pages/lms-live-quiz-session-runtime.js'), 'utf8');
    }
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match ? match[0] : '';
}

describe('LMS live quiz session remove', () => {
    it('adds top-right remove control on the session card when multiple sessions exist', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function renderLmsLiveSessionCardHeader');
        expect(uiSource).toContain('lms-live-session-head');
        expect(uiSource).toContain('lms-live-session-remove-btn');
        expect(uiSource).toContain('items.length >= 2 && editingSession');
        expect(uiSource).toContain('openLmsLiveSessionRemoveDialog');
        expect(uiSource).toContain('renderLmsLiveSessionCardHeader(resourceKey, workspace.sessions, editingSession)');
    });

    it('redesigns the active session switcher as a lux picker with scroll cap', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const bareCss = readSource('assets/css/lux-page-bare-lite.css');
        const switcherBlock = uiSource;

        expect(switcherBlock).toContain('lms-live-session-switcher-');
        expect(switcherBlock).toContain('lms-route-select');
        expect(switcherBlock).toContain('data-lux-picker-enhanced="true"');
        expect(switcherBlock).toContain('data-lux-picker-subtitle');
        expect(uiSource).toContain('enhanceUniversalPicker(switcher)');
        expect(bareCss).toContain('.lms-live-session-switcher-field .lux-picker-panel');
        expect(bareCss).toContain('--lux-picker-visible-options: 5');
    });

    it('uses a two-step verification dialog before deleting sessions', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function renderLmsLiveSessionRemoveDialog');
        expect(uiSource).toContain('Step ${step} of 2');
        expect(uiSource).not.toContain('lms-live-session-remove-token');
        expect(uiSource).toContain('advanceLmsLiveSessionRemoveDialog');
        expect(uiSource).toContain('confirmLmsLiveSessionRemove');
        expect(uiSource).toContain('This session is live. Removing it will end the broadcast for students immediately.');
        expect(uiSource).toContain('Remove ${displayName} permanently? This cannot be undone.');
        const confirmBlock = extractFunctionBody(uiSource, 'confirmLmsLiveSessionRemove');
        expect(confirmBlock).not.toContain('lms-live-session-remove-token');
    });

    it('deletes the selected session and keeps at least one remaining', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const deleteBlock = extractFunctionBody(uiSource, 'deleteLmsLiveSession');

        expect(deleteBlock).toContain('sessions.length < 2');
        expect(deleteBlock).toContain("markLmsLiveQuizLocalSync(canonicalKey, 'session-deleted')");
        expect(deleteBlock).toContain("saveLmsLiveQuizChange(canonicalKey, 'session-deleted', { skipBackendSync: true })");
        expect(deleteBlock).toContain("syncStaffLmsLiveQuizSessionChange(canonicalKey, 'session-deleted'");
        expect(deleteBlock).toContain('includeQueue: wasActive || wasLive');
        expect(deleteBlock).toContain('includeBroadcast: wasLive');
        expect(uiSource).toContain('function syncStaffLmsLiveQuizSessionChange');
        expect(uiSource).toContain('function updateLmsLiveQuizSessionUi');
        expect(uiSource).toContain('data-lms-live-region="session-header"');
        expect(uiSource).toContain('data-lms-live-region="session-switcher"');
        const sessionSyncBlock = extractFunctionBody(uiSource, 'syncStaffLmsLiveQuizSessionChange');
        expect(sessionSyncBlock).toContain('deferUiRefresh: true');
        expect(sessionSyncBlock).toContain('syncPromise.finally');
        expect(sessionSyncBlock).toContain('applyLmsLiveQuizSessionPatches');
        expect(sessionSyncBlock).not.toContain('forceStructuralRender');
        expect(deleteBlock).toContain('workspace.ui.activeSessionId = fallback?.id || null');
        expect(deleteBlock).toContain('unmountLmsLivePodiumOverlay');
    });

    it('pauses background refresh while the remove dialog is open', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const refreshBlock = extractFunctionBody(uiSource, 'refreshLmsLiveQuizUi\\(resourceKey, options = \\{\\}\\)');

        expect(uiSource).toContain('function isLmsLiveSessionRemoveDialogOpen()');
        expect(refreshBlock).toContain('isLmsLiveSessionRemoveDialogOpen()');
        expect(uiSource).toContain('renderLmsLiveSessionRemoveDialogCard');
        const mountBlock = extractFunctionBody(uiSource, 'mountLmsLiveSessionRemoveDialog');
        expect(mountBlock).toContain('overlay.innerHTML = renderLmsLiveSessionRemoveDialogCard');
    });
});