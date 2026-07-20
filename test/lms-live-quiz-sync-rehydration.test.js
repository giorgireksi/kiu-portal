import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz sync rehydration', () => {
    it('reloads live workspaces from the server instead of trusting cached loadedFromBackend', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(workspaceSource).toContain('function shouldReloadLmsLiveQuizFromBackend');
        expect(workspaceSource).toContain('hasLmsLiveQuizLiveSession(canonicalKey)');
        expect(workspaceSource).toContain('lastServerSyncAt');
        expect(workspaceSource).not.toMatch(
            /loadedFromBackend\s*&&\s*!workspace\.ui\.dirty\s*&&\s*!workspace\.ui\.syncError\) return;/
        );
    });

    it('recomputes participant scores from stored answers after merge or normalize', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(workspaceSource).toContain('function rehydrateLmsLiveSessionParticipants');
        expect(workspaceSource).toContain('calculateLmsLiveAnswerScore(');
        expect(workspaceSource).toContain('rehydrateLmsLiveSessionParticipants(normalized)');
    });

    it('keeps live quiz workspaces out of local persistence', () => {
        const stateSource = readSource('assets/js/app/state.js');
        const apiSource = readSource('assets/js/app/api.js');

        expect(stateSource).toContain('delete KIU_STATE.lmsLiveQuizzes');
        expect(stateSource).toContain('delete persisted.lmsLiveQuizzes');
        expect(apiSource).toContain('delete snapshot.lmsLiveQuizzes');
    });

    it('prefers the live session for staff views over draft activeSessionId', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(workspaceSource).toContain('function getLmsLiveStaffLiveSession');
        expect(workspaceSource).toContain('function getLmsLiveStaffEditingSession');
        expect(workspaceSource).toContain('participants: {}');
    });

    it('counts staff-visible answers with the shared show-version helper', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(workspaceSource).toContain('function hasLmsLiveAnswerForQuestion');
        expect(workspaceSource).toContain('hasLmsLiveAnswerForQuestion(answer, currentQuestion)');
        expect(uiSource).toContain('hasLmsLiveAnswerForQuestion(answer, question)');
    });
});