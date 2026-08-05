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

describe('LMS live quiz staff queue regional patching', () => {
    it('splits queue signature from shell layout fingerprint', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(workspaceSource).toContain('function getLmsLiveQuizQueueSignature(resourceKey)');
        expect(workspaceSource).toContain('function storeLmsLiveQuizQueueSignature(resourceKey');

        const layoutFn = workspaceSource.match(/function getLmsLiveQuizLayoutFingerprint\([\s\S]*?\n\}/)?.[0] || '';
        expect(layoutFn).not.toContain('questionIds');

        const queueFn = workspaceSource.match(/function getLmsLiveQuizQueueSignature\([\s\S]*?\n\}/)?.[0] || '';
        expect(queueFn).toContain('.map(');
        expect(queueFn).toContain('item.state');
    });

    it('routes queue mutations through immediate sync and smart refresh', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function syncStaffLmsLiveQuizQueueChange(resourceKey, reason');
        expect(uiSource).toContain('const LMS_LIVE_QUEUE_PATCH_HINTS = {');

        const syncQueueBlock = extractFunctionBody(uiSource, 'syncStaffLmsLiveQuizQueueChange\\(resourceKey, reason');
        expect(syncQueueBlock).toContain('deferUiRefresh: true');
        expect(syncQueueBlock).toContain('queueStructural: true');
        expect(syncQueueBlock).toMatch(/refreshStaffLmsLiveQuizUi[\s\S]*forceQueuePatch: true/);
        expect(syncQueueBlock).toMatch(/\.finally\([\s\S]*refreshLmsLiveQuizUi[\s\S]*forceQueuePatch: true/);
        expect(syncQueueBlock).not.toContain('renderLmsLiveQuizSection(resourceKey)');

        [
            'duplicateLmsLiveQuestion',
            'moveLmsLiveQuestion',
            'deleteLmsLiveQuestion',
            'clearLmsLiveAnswers'
        ].forEach((fn) => {
            const block = extractFunctionBody(uiSource, `${fn}\\(`);
            expect(block).toContain('syncStaffLmsLiveQuizQueueChange');
            expect(block).not.toContain('renderLmsLiveQuizSection(resourceKey)');
        });
    });

    it('patches queue region in place for staff queue edits', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function updateLmsLiveQuizQueueUi(resourceKey, hints = {})');
        expect(uiSource).toContain("patchLmsLiveQuizRegion(contentArea, 'queue', renderLmsLiveStaffQueueMarkup(");

        const queueBlock = extractFunctionBody(uiSource, 'updateLmsLiveQuizQueueUi\\(resourceKey, hints = \\{\\}\\)');
        expect(queueBlock).not.toContain('contentArea.innerHTML');
        expect(queueBlock).not.toContain('renderLmsLiveStaffWorkspace');
    });

    it('routes refresh when shell is stable but queue signature changes', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const refreshBlock = extractFunctionBody(uiSource, 'refreshLmsLiveQuizUi\\(resourceKey, options = \\{\\}\\)');

        expect(refreshBlock).toContain('getLmsLiveQuizQueueSignature');
        expect(refreshBlock).toMatch(/updateLmsLiveQuizQueueUi\(\s*canonicalKey/);
        expect(refreshBlock).toMatch(/layoutFingerprint === previousLayout[\s\S]*queueChanged[\s\S]*updateLmsLiveQuizQueueUi/);
        expect(refreshBlock).toContain('forceQueuePatch');
        expect(refreshBlock).toMatch(/queueChanged \|\| forceQueuePatch/);
        expect(uiSource).toContain("'question-ready': {}");
    });

    it('keeps presentation toggle on structural render path', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const presentBlock = extractFunctionBody(uiSource, 'toggleLmsLivePresentationMode\\(resourceKey\\)');
        expect(presentBlock).toContain('renderLmsLiveQuizSection(resourceKey)');
    });

    it('uses live-first queue session and verifies delete removal', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();
        const uiSource = readLmsLiveQuizUiChain();

        expect(workspaceSource).toContain('function getLmsLiveStaffQueueSession(resourceKey)');
        expect(workspaceSource).toMatch(/getLmsLiveStaffLiveSession[\s\S]*return liveSession[\s\S]*getLmsLiveStaffEditingSession/);

        const queueSigFn = workspaceSource.match(/function getLmsLiveQuizQueueSignature\([\s\S]*?\n\}/)?.[0] || '';
        expect(queueSigFn).toContain('getLmsLiveStaffQueueSession');

        const deleteBlock = extractFunctionBody(uiSource, 'deleteLmsLiveQuestion\\(resourceKey, questionId\\)');
        expect(deleteBlock).toContain('resolveLmsLiveStaffQueueMutationSession');
        expect(deleteBlock).toContain('sourceIndex < 0');
        expect(deleteBlock).toContain('forceBroadcastPatch: wasOnAir');

        const refreshBlock = extractFunctionBody(uiSource, 'refreshLmsLiveQuizUi\\(resourceKey, options = \\{\\}\\)');
        expect(refreshBlock).toContain('forcedPatchNeeded');
        expect(refreshBlock).toContain('forceStructuralRender: true');
    });
});