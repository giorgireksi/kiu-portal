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
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match ? match[0] : '';
}

describe('LMS live quiz clock refresh throttling', () => {
    it('avoids forced structural staff refresh during routine sync and clock ticks', () => {
        const liveQuizUiSource = readLmsLiveQuizUiChain();
        const liveQuizWorkspaceSource = readLmsLiveQuizWorkspaceRuntime();

        const refreshStaffBlock = liveQuizUiSource.match(/function refreshStaffLmsLiveQuizUi\([\s\S]*?\n\}/)?.[0] || '';
        expect(refreshStaffBlock).not.toContain('forceStructuralRender: true');
        expect(liveQuizUiSource).toContain('runImmediateLmsLiveQuizSync(canonicalKey, reason, { deferUiRefresh: true })');
        expect(liveQuizUiSource).not.toMatch(/syncStaffLmsLiveQuizControl[\s\S]*refreshStaffLmsLiveQuizUi\(resourceKey\);\s*const syncPromise/);
        expect(liveQuizWorkspaceSource).toContain('!options.deferUiRefresh && isLmsActiveTab(\'live-quiz\')');
        expect(liveQuizWorkspaceSource).toContain('patchLmsLiveQuizTimerUi(canonicalKey)');
        expect(liveQuizWorkspaceSource).toMatch(/scheduleLmsLiveClockRefresh[\s\S]*patchLmsLiveQuizTimerUi\(canonicalKey\)/);
    });

    it('splits timer and volatile refresh paths in the UI runtime', () => {
        const liveQuizUiSource = readLmsLiveQuizUiChain();

        expect(liveQuizUiSource).toContain('function patchLmsLiveQuizTimerUi(resourceKey)');
        expect(liveQuizUiSource).toContain('function updateLmsLiveQuizVolatileUi(resourceKey)');
        expect(liveQuizUiSource).toContain('fillNode.style.setProperty(\'--live-progress\'');
        expect(liveQuizUiSource).toContain('data-lms-live-region="director-answered"');
        expect(liveQuizUiSource).toContain('data-lms-live-region="director-student-view"');
        expect(liveQuizUiSource).toContain('data-lms-live-region="stage-clock-pill"');
        const volatileUiBlock = extractFunctionBody(liveQuizUiSource, 'updateLmsLiveQuizVolatileUi\\(resourceKey\\)');
        expect(volatileUiBlock).not.toContain("patchLmsLiveQuizRegion(contentArea, 'options'");
        expect(volatileUiBlock).not.toContain("patchLmsLiveQuizRegion(contentArea, 'broadcast-controls'");

        const broadcastUiBlock = extractFunctionBody(liveQuizUiSource, 'updateLmsLiveQuizBroadcastUi\\(resourceKey, hints = \\{\\}\\)');
        expect(broadcastUiBlock).toContain("patchLmsLiveQuizRegion(contentArea, 'broadcast-controls'");

        const refreshUiBlock = extractFunctionBody(liveQuizUiSource, 'refreshLmsLiveQuizUi\\(resourceKey, options = \\{\\}\\)');
        expect(refreshUiBlock).toContain('volatileSignature !== previousVolatile');
        expect(refreshUiBlock).toContain('updateLmsLiveQuizVolatileUi(canonicalKey)');
        expect(refreshUiBlock).toMatch(/updateLmsLiveQuizBroadcastUi\(\s*canonicalKey/);
    });

    it('uses volatile-only refresh for participant merges and answer submit callbacks', () => {
        const liveQuizWorkspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(liveQuizWorkspaceSource).toContain('LMS_LIVE_LOCAL_SYNC_ECHO_MS');
        expect(liveQuizWorkspaceSource).toContain('__KIU_LMS_WORKSPACE_SYNC_TIMING__');
        expect(liveQuizWorkspaceSource).not.toContain('forceStructuralRender: options.forceRender === true || shouldMergeParticipantsOnly');
        expect(liveQuizWorkspaceSource).not.toContain("invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true, forceStructuralRender: true })");
        expect(liveQuizWorkspaceSource).toContain('staffControlsLiveQuestion');
    });
});