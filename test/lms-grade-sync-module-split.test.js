import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS grade sync module split', () => {
    it('moves LMS-to-gradebook sync helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const gradeSyncRuntimeSource = readSource('assets/js/pages/lms-grade-sync-runtime.js');

        expect(lmsHtml).not.toContain('assets/js/pages/lms-grade-sync-runtime.js');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-grade-sync-runtime.js?v=20260518-lmsgrade1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('LMS_QUIZ_MODULE_URLS');
        expect(gradeSyncRuntimeSource).toContain('function getGradebookRosterForQuizResource(resourceKey)');
        expect(gradeSyncRuntimeSource).toContain('function buildLmsQuizGradebookMeta(resourceKey, quiz = {}, overrides = {})');
        expect(gradeSyncRuntimeSource).toContain('function buildLmsQuizGradebookNote(resourceKey, quiz = {}, noteSuffix = \'\')');
        expect(gradeSyncRuntimeSource).toContain('function seedQuizIntoGradebook(resourceKey, quiz)');
        expect(gradeSyncRuntimeSource).toContain('function applyQuizScoreToGradebook(resourceKey, quiz, studentId, rawScore, updatedBy, noteSuffix = \'\')');
        expect(gradeSyncRuntimeSource).toContain('function syncLmsQuizRoster(resourceKey, quiz)');
        expect(lmsSource).not.toContain('function getGradebookRosterForQuizResource(resourceKey)');
        expect(lmsSource).not.toContain('function buildLmsQuizGradebookMeta(resourceKey, quiz = {}, overrides = {})');
        expect(lmsSource).not.toContain('function buildLmsQuizGradebookNote(resourceKey, quiz = {}, noteSuffix = \'\')');
        expect(lmsSource).not.toContain('function seedQuizIntoGradebook(resourceKey, quiz)');
        expect(lmsSource).not.toContain('function applyQuizScoreToGradebook(resourceKey, quiz, studentId, rawScore, updatedBy, noteSuffix = \'\')');
        expect(lmsSource).not.toContain('function syncLmsQuizRoster(resourceKey, quiz)');
    });
});
