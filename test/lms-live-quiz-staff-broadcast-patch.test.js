import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz staff broadcast regional patching', () => {
    it('splits layout and broadcast fingerprints so control clicks avoid full paint', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(workspaceSource).toContain('function getLmsLiveQuizLayoutFingerprint(resourceKey)');
        expect(workspaceSource).toContain('function getLmsLiveQuizBroadcastSignature(resourceKey)');
        expect(workspaceSource).toContain('function storeLmsLiveQuizBroadcastSignature(resourceKey');
        expect(workspaceSource).toContain('getLmsLiveQuizLayoutFingerprint(canonicalKey)');

        const layoutFn = workspaceSource.match(/function getLmsLiveQuizLayoutFingerprint\([\s\S]*?\n\}/)?.[0] || '';
        expect(layoutFn).not.toContain("String(question?.state || '')");
        expect(layoutFn).not.toContain('currentQuestionIndex');
        expect(layoutFn).not.toContain('questionIds');
        expect(workspaceSource).toContain('function getLmsLiveQuizQueueSignature(resourceKey)');

        const broadcastFn = workspaceSource.match(/function getLmsLiveQuizBroadcastSignature\([\s\S]*?\n\}/)?.[0] || '';
        expect(broadcastFn).toContain("String(question?.state || '')");
        expect(broadcastFn).toContain('String(session?.showResults || false)');
        expect(broadcastFn).toContain('String(session?.showPodium || false)');
        expect(broadcastFn).toContain("String(session?.podiumRevealAt || '')");
    });

    it('routes staff sync through broadcast patch hints instead of full structural paint', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(uiSource).toContain('const LMS_LIVE_BROADCAST_PATCH_HINTS = {');

        const syncStaffBlock = uiSource.match(/function syncStaffLmsLiveQuizControl\([\s\S]*?\n\}/)?.[0] || '';
        expect(syncStaffBlock).toContain('broadcastPatchHints');
        expect(syncStaffBlock).toContain('LMS_LIVE_BROADCAST_PATCH_HINTS[reason]');
        expect(syncStaffBlock).toContain('deferUiRefresh: true');
        expect(syncStaffBlock).toContain('forceBroadcastPatch: true');
        expect(syncStaffBlock).toMatch(/refreshStaffLmsLiveQuizUi[\s\S]*forceBroadcastPatch: true/);
        expect(syncStaffBlock).not.toContain('forceStructuralRender: true');
        expect(syncStaffBlock).not.toContain('paintLmsLiveQuizSectionContent');
        expect(syncStaffBlock).toMatch(/\.finally\([\s\S]*refreshLmsLiveQuizUi/);
    });

    it('patches broadcast regions in place for staff control state changes', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(uiSource).toContain('function updateLmsLiveQuizBroadcastUi(resourceKey, hints = {})');
        expect(uiSource).toContain('function renderLmsLiveBroadcastQuestionCardInner(');
        expect(uiSource).toContain("patchLmsLiveQuizRegion(contentArea, 'broadcast-controls'");
        expect(uiSource).toContain("patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRailSteps(currentQuestion));");
        expect(uiSource).toContain('renderLmsLiveBroadcastControlDeckContent(canonicalKey, session, currentQuestion)');

        const broadcastBlock = uiSource.match(/function updateLmsLiveQuizBroadcastUi\([\s\S]*?\n\}/)?.[0] || '';
        expect(broadcastBlock).not.toContain('contentArea.innerHTML');
        expect(broadcastBlock).not.toContain('renderLmsLiveStaffWorkspace');

        const refreshBlock = uiSource.match(/function refreshLmsLiveQuizUi\([\s\S]*?\n\}/)?.[0] || '';
        expect(refreshBlock).toContain('getLmsLiveQuizLayoutFingerprint');
        expect(refreshBlock).toContain('getLmsLiveQuizBroadcastSignature');
        expect(refreshBlock).toMatch(/updateLmsLiveQuizBroadcastUi\(\s*canonicalKey/);
        expect(refreshBlock).toMatch(/layoutFingerprint === previousLayout[\s\S]*updateLmsLiveQuizBroadcastUi/);
    });

    it('keeps staff control handlers on deferred sync path', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        [
            'pauseLmsLiveQuestion',
            'lockLmsLiveQuestion',
            'revealLmsLiveQuestion',
            'toggleLmsLiveResults',
            'stepLmsLiveQuestion',
            'revealLmsLiveQuizPodium',
            'dismissLmsLiveQuizPodium'
        ].forEach((fn) => {
            expect(uiSource).toMatch(new RegExp(`function ${fn}[\\s\\S]*syncStaffLmsLiveQuizControl`));
        });
    });

    it('routes podium reveal and dismiss through broadcast patch hints', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(uiSource).toContain("'podium-reveal': { includeResults: true }");
        expect(uiSource).toContain("'podium-dismiss': {}");

        const revealBlock = uiSource.match(/function revealLmsLiveQuizPodium\([\s\S]*?\n\}/)?.[0] || '';
        expect(revealBlock).toContain("syncStaffLmsLiveQuizControl(resourceKey, 'podium-reveal')");
        expect(revealBlock).not.toContain('syncLmsLivePodiumOverlay');
        expect(uiSource).toContain('function finalizeLmsLivePodiumOverlay(resourceKey)');

        const dismissBlock = uiSource.match(/function dismissLmsLiveQuizPodium\([\s\S]*?\n\}/)?.[0] || '';
        expect(dismissBlock).toContain("syncStaffLmsLiveQuizControl(resourceKey, 'podium-dismiss')");
        expect(dismissBlock).toContain('unmountLmsLivePodiumOverlay()');
    });
});