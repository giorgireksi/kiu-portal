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

describe('LMS live quiz broadcast layout', () => {
    it('patches status-rail steps without nesting duplicate region wrappers', () => {
        const liveQuizUiSource = readLmsLiveQuizUiChain();

        expect(liveQuizUiSource).toContain('function renderLmsLiveStatusRailSteps(question = null)');
        expect(liveQuizUiSource).toContain("patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRailSteps(currentQuestion));");
        expect(liveQuizUiSource).toContain('data-lms-live-region="status-rail" class="lms-live-status-rail"');
        expect(liveQuizUiSource).not.toContain("patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRail(currentQuestion));");
    });

    it('uses the redesigned staff broadcast zones and grouped control deck', () => {
        const liveQuizUiSource = readLmsLiveQuizUiChain();
        expect(liveQuizUiSource).toContain('function renderLmsLiveBroadcastHeader(');
        expect(liveQuizUiSource).toContain('function renderLmsLiveBroadcastQuestionCard(');
        expect(liveQuizUiSource).toContain('function renderLmsLiveBroadcastControlDeck(');
        expect(liveQuizUiSource).toContain('data-lms-live-region="broadcast-controls"');
        expect(liveQuizUiSource).toContain('data-lms-live-region="broadcast-question"');
        expect(liveQuizUiSource).toContain('lms-live-broadcast-control-deck');
        expect(liveQuizUiSource).toContain('lms-live-control-group-label');
        expect(liveQuizUiSource).not.toContain('data-lms-live-region="stage-breakdown"');
        expect(liveQuizUiSource).not.toContain("patchLmsLiveQuizRegion(contentArea, 'stage-breakdown'");
    });

    it('keeps presentation-mode results in the stage and uses state-aware timer classes', () => {
        const liveQuizUiSource = readLmsLiveQuizUiChain();
        expect(liveQuizUiSource).toContain('function renderLmsLiveBroadcastResultsCard(');
        expect(liveQuizUiSource).toContain('presentationMode: Boolean(workspace.ui.presentationMode)');
        expect(liveQuizUiSource).toContain('data-lms-live-region="broadcast-results"');
        expect(liveQuizUiSource).toContain("isClosed ? 'is-closed' : ''");
        expect(liveQuizUiSource).toContain('<i class="fas fa-lock" aria-hidden="true"></i>');
    });
});