import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

function ssvcHubAndQa() {
    // QA first so body splits hit real implementations, not hub stubs.
    return readAsset('assets/js/pages/student-service-qa.js') + readAsset('assets/js/pages/student-service.js');
}

function collectAnswerBranchIds(questionId, answerId, answers = []) {
    const removeIds = new Set([answerId]);
    answers.forEach(answer => {
        const parentId = String(answer.parentAnswerId || '').trim();
        const id = String(answer.id || '').trim();
        if (!id || String(answer.questionId || '') !== questionId) return;
        if (parentId && removeIds.has(parentId)) removeIds.add(id);
    });
    return removeIds;
}

function pruneAnswersForQuestionSnapshot(questionId, snapshotAnswers, flatAnswers) {
    const snapshotIds = new Set(
        (snapshotAnswers || [])
            .map(answer => String(answer.id || '').trim())
            .filter(Boolean)
    );
    return (flatAnswers || []).filter(answer =>
        String(answer.questionId || '') !== questionId
        || snapshotIds.has(String(answer.id || '').trim())
    );
}

describe('student service answer delete merge', () => {
    it('prunes removed top-level answers from flat state after delete snapshot merge', () => {
        const questionId = 'svc-question-1';
        const flatAnswers = [
            { id: 'a1', questionId, body: 'keep' },
            { id: 'a2', questionId, body: 'delete me' },
            { id: 'a3', questionId: 'other', body: 'other question' }
        ];
        const snapshotAnswers = [{ id: 'a1', questionId, body: 'keep' }];

        const pruned = pruneAnswersForQuestionSnapshot(questionId, snapshotAnswers, flatAnswers);

        expect(pruned.map(answer => answer.id)).toEqual(['a1', 'a3']);
    });

    it('prunes nested child replies when parent is removed from snapshot', () => {
        const questionId = 'svc-question-1';
        const flatAnswers = [
            { id: 'parent', questionId, body: 'parent' },
            { id: 'child', questionId, parentAnswerId: 'parent', body: 'child' },
            { id: 'sibling', questionId, body: 'sibling' }
        ];
        const removeIds = collectAnswerBranchIds(questionId, 'parent', flatAnswers);
        const snapshotAnswers = flatAnswers.filter(answer => !removeIds.has(answer.id));

        const pruned = pruneAnswersForQuestionSnapshot(questionId, snapshotAnswers, flatAnswers);

        expect(pruned.map(answer => answer.id)).toEqual(['sibling']);
    });

    it('student-service.js merge path prunes stale answer ids and exposes branch helpers', () => {
        const source = ssvcHubAndQa();
        const mergeBlock = source.split('function mergeStudentServiceQuestionSnapshot(')[1]?.split('\nfunction ')[0] || '';

        expect(source).toContain('function collectStudentServiceAnswerBranchIds(');
        expect(source).toContain('function removeStudentServiceAnswersFromSnapshot(');
        expect(mergeBlock).toContain('const snapshotIds = new Set(');
        expect(mergeBlock).toContain('snapshotIds.has(String(answer.id || \'\').trim())');
        expect(source).toContain('removeStudentServiceAnswersFromSnapshot(questionId, removeIds)');
    });
});
